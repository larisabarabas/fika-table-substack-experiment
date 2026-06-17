import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { CONFIG } from '../config';

function rowToSlice(row) {
  return {
    id:        row.id,
    idx:       row.idx,         // null = bonus note
    fromName:  row.from_name,
    toName:    row.to_name,
    toType:    row.to_type,
    message:   row.message,
    color:     row.color,
    createdAt: row.created_at,
  };
}

export function useSlices() {
  const [slices, setSlices]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Memoize filled map so memo'd children don't re-render on unrelated state changes
  const filled = useMemo(() => {
    const map = {};
    for (const s of slices) {
      if (s.idx !== null && s.idx !== undefined) map[s.idx] = s;
    }
    return map;
  }, [slices]);

  const sharedCount = Object.keys(filled).length;
  const isFull      = sharedCount >= CONFIG.sliceCapacity;

  // Fetch all slices on mount (parallel with nothing else to wait for here)
  useEffect(() => {
    let active = true;

    supabase
      .from('slices')
      .select('id,idx,from_name,to_name,to_type,message,color,created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (!active) return;
        if (err) { setError(err); setLoading(false); return; }
        setSlices((data ?? []).map(rowToSlice));
        setLoading(false);
      });

    // Realtime: INSERT only (no updates/deletes allowed for anon)
    const channel = supabase
      .channel('slices-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'slices' }, (payload) => {
        const incoming = rowToSlice(payload.new);
        setSlices(curr => {
          // Deduplicate in case our optimistic update already added it
          const exists = curr.some(s => s.id === incoming.id);
          return exists ? curr : [incoming, ...curr];
        });
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Insert a new slice or bonus note
  // Pass idx (number) for a cake slice, null for a bonus note
  const insertSlice = useCallback(async (data) => {
    const row = {
      idx:       data.idx ?? null,
      from_name: data.fromName?.trim() || null,
      to_name:   data.toName,
      to_type:   data.toType,
      message:   data.message.trim(),
      color:     data.color,
      host:      false,
    };

    // Optimistic update
    const optimistic = { ...data, id: 'opt-' + Date.now(), createdAt: new Date().toISOString() };
    setSlices(curr => [optimistic, ...curr]);

    const { data: inserted, error: err } = await supabase
      .from('slices')
      .insert(row)
      .select()
      .single();

    if (err) {
      // On UNIQUE conflict for idx, find next free slot and retry
      if (err.code === '23505' && data.idx !== null) {
        setSlices(curr => curr.filter(s => s.id !== optimistic.id));
        return { error: 'conflict', message: 'That slice was just taken. Please pick another.' };
      }
      setSlices(curr => curr.filter(s => s.id !== optimistic.id));
      return { error: err.message };
    }

    // Replace optimistic entry with real row
    const real = rowToSlice(inserted);
    setSlices(curr => curr.map(s => s.id === optimistic.id ? real : s));
    return { data: real };
  }, []);

  // Find the lowest free idx (for "Cut a slice" header button)
  const nextFreeIdx = useCallback(() => {
    for (let i = 0; i < CONFIG.sliceCapacity; i++) {
      if (!filled[i]) return i;
    }
    return null;
  }, [filled]);

  return { slices, filled, sharedCount, isFull, loading, error, insertSlice, nextFreeIdx };
}
