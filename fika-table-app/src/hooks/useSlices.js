import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { CONFIG } from '../config';
import { rememberSlice, forgetSlice } from '../lib/ownedSlices';
import { updateSlice, deleteSlice } from '../lib/api';

function rowToSlice(row) {
  return {
    id:        row.id,
    idx:       row.idx,
    round:     row.round ?? 0,
    fromName:  row.from_name,
    toName:    row.to_name,
    toType:    row.to_type,
    message:   row.message,
    color:     row.color,
    createdAt: row.created_at,
    editedAt:  row.edited_at ?? null,
  };
}

export function useSlices() {
  const [slices,       setSlices]       = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [roundSize,    setRoundSize]    = useState(CONFIG.sliceCapacity);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // currentFilled: idx → slice for the active round only (shown on the cake)
  const currentFilled = useMemo(() => {
    const map = {};
    for (const s of slices) {
      if (s.round === currentRound && s.idx !== null && s.idx !== undefined) {
        map[s.idx] = s;
      }
    }
    return map;
  }, [slices, currentRound]);

  const takenThisRound = Object.keys(currentFilled).length;
  const isFull         = takenThisRound >= roundSize;

  useEffect(() => {
    let active = true;
    let slicesChannel = null;
    let configChannel = null;

    Promise.all([
      supabase
        .from('slices')
        .select('id,idx,round,from_name,to_name,to_type,message,color,created_at,edited_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('cake_config')
        .select('round,round_size')
        .eq('id', 1)
        .single(),
    ]).then(([{ data: sliceData, error: sliceErr }, { data: cfg, error: cfgErr }]) => {
      if (!active) return;
      if (sliceErr) { setError(sliceErr); setLoading(false); return; }
      if (cfgErr)   { setError(cfgErr);   setLoading(false); return; }

      setSlices((sliceData ?? []).map(rowToSlice));
      if (cfg) {
        setCurrentRound(cfg.round);
        setRoundSize(cfg.round_size);
      }
      setLoading(false);

      slicesChannel = supabase
        .channel('slices-live')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'slices' }, (payload) => {
          const incoming = rowToSlice(payload.new);
          setSlices(curr => {
            const exists = curr.some(s => s.id === incoming.id);
            return exists ? curr : [incoming, ...curr];
          });
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'slices' }, (payload) => {
          const next = rowToSlice(payload.new);
          setSlices(curr => curr.map(s => (s.id === next.id ? next : s)));
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'slices' }, (payload) => {
          const id = payload.old?.id;
          if (id) setSlices(curr => curr.filter(s => s.id !== id));
        })
        .subscribe();

      configChannel = supabase
        .channel('config-live')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'cake_config' }, (payload) => {
          if (!active) return;
          setCurrentRound(payload.new.round);
          setRoundSize(payload.new.round_size);
        })
        .subscribe();
    }).catch((err) => {
      if (!active) return;
      setError(err);
      setLoading(false);
    });

    return () => {
      active = false;
      if (slicesChannel) supabase.removeChannel(slicesChannel);
      if (configChannel) supabase.removeChannel(configChannel);
    };
  }, []);

  const insertSlice = useCallback(async (data) => {
    const optimistic = { ...data, round: currentRound, id: 'opt-' + Date.now(), createdAt: new Date().toISOString() };
    setSlices(curr => [optimistic, ...curr]);

    // give_slice also creates the slice's secret and hands back its edit token, once
    const { data: inserted, error: err } = await supabase.rpc('give_slice', {
      p_idx:       data.idx ?? null,
      p_from_name: data.fromName?.trim() || null,
      p_to_name:   data.toName,
      p_to_type:   data.toType,
      p_message:   data.message.trim(),
      p_color:     data.color,
    });

    if (err) {
      if (err.code === '23505' && data.idx !== null) {
        setSlices(curr => curr.filter(s => s.id !== optimistic.id));
        // Local state can't be trusted here: the slice that beat us may not have
        // arrived over realtime yet. Ask the database what is taken this round.
        const { data: taken, error: takenErr } = await supabase
          .from('slices')
          .select('id,idx,round,from_name,to_name,to_type,message,color,created_at,edited_at')
          .eq('round', currentRound);
        const takenIdx = new Set(takenErr ? [data.idx] : (taken ?? []).map(r => r.idx));
        if (!takenErr && taken?.length) {
          const seen = new Set();
          setSlices(curr => {
            curr.forEach(s => seen.add(s.id));
            const fresh = taken.filter(r => !seen.has(r.id)).map(rowToSlice);
            return fresh.length ? [...fresh, ...curr] : curr;
          });
        }
        let freeIdx = null;
        for (let i = 0; i < roundSize; i++) {
          if (!takenIdx.has(i) && !currentFilled[i]) { freeIdx = i; break; }
        }
        return { error: 'conflict', freeIdx };
      }
      setSlices(curr => curr.filter(s => s.id !== optimistic.id));
      return { error: err.message };
    }

    const real = rowToSlice(inserted);
    const editToken = inserted.edit_token;
    rememberSlice(real.id, editToken);
    // Realtime may already have delivered this slice; never list it twice
    setSlices(curr => curr.some(s => s.id === real.id)
      ? curr.filter(s => s.id !== optimistic.id)
      : curr.map(s => s.id === optimistic.id ? real : s));
    return { data: real, editToken };
  }, [currentRound, roundSize, currentFilled]);

  // Edit or delete a slice this browser owns. Both resolve to { data } or { error }, where
  // error is 'forbidden', 'window_closed' or 'other'; the list follows without waiting for realtime.
  const editSlice = useCallback(async (id, token, fields) => {
    try {
      const updated = await updateSlice({ id, token, ...fields });
      setSlices(curr => curr.map(s => (s.id === id ? updated : s)));
      return { data: updated };
    } catch (err) {
      if (err.reason === 'forbidden') forgetSlice(id);
      return { error: err.reason ?? 'other' };
    }
  }, []);

  const removeSlice = useCallback(async (id, token) => {
    try {
      await deleteSlice({ id, token });
      forgetSlice(id);
      setSlices(curr => curr.filter(s => s.id !== id));
      return {};
    } catch (err) {
      if (err.reason === 'forbidden') forgetSlice(id);
      return { error: err.reason ?? 'other' };
    }
  }, []);

  const nextFreeIdx = useCallback(() => {
    for (let i = 0; i < roundSize; i++) {
      if (!currentFilled[i]) return i;
    }
    return null;
  }, [currentFilled, roundSize]);

  return {
    slices,
    filled:         currentFilled,
    sharedCount:    takenThisRound,
    takenThisRound,
    roundSize,
    currentRound,
    isFull,
    loading,
    error,
    insertSlice,
    editSlice,
    removeSlice,
    nextFreeIdx,
  };
}
