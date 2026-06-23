import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { CONFIG } from '../config';

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
        .select('id,idx,round,from_name,to_name,to_type,message,color,created_at')
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
    const row = {
      round:     currentRound,
      idx:       data.idx ?? null,
      from_name: data.fromName?.trim() || null,
      to_name:   data.toName,
      to_type:   data.toType,
      message:   data.message.trim(),
      color:     data.color,
      host:      false,
    };

    const optimistic = { ...data, round: currentRound, id: 'opt-' + Date.now(), createdAt: new Date().toISOString() };
    setSlices(curr => [optimistic, ...curr]);

    const { data: inserted, error: err } = await supabase
      .from('slices')
      .insert(row)
      .select()
      .single();

    if (err) {
      if (err.code === '23505' && data.idx !== null) {
        setSlices(curr => curr.filter(s => s.id !== optimistic.id));
        return { error: 'conflict', message: 'That slice was just taken. Please pick another.' };
      }
      setSlices(curr => curr.filter(s => s.id !== optimistic.id));
      return { error: err.message };
    }

    const real = rowToSlice(inserted);
    setSlices(curr => curr.map(s => s.id === optimistic.id ? real : s));
    return { data: real };
  }, [currentRound]);

  const nextFreeIdx = useCallback(() => {
    for (let i = 0; i < roundSize; i++) {
      if (!currentFilled[i]) return i;
    }
    return null;
  }, [currentFilled, roundSize]);

  // Host action: brings out a fresh cake by incrementing the round
  const freshCake = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('cake_config')
      .update({ round: currentRound + 1 })
      .eq('id', 1)
      .select()
      .single();
    if (err) return { error: err.message };
    if (!data) return { error: 'Could not start a fresh round — permission denied.' };
    return { data: true };
  }, [currentRound]);

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
    nextFreeIdx,
    freshCake,
  };
}
