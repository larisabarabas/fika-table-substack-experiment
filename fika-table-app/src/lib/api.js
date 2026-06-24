import { supabase } from './supabase';

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

export async function fetchSlice(id) {
  const { data, error } = await supabase
    .from('slices')
    .select('id,idx,round,from_name,to_name,to_type,message,color,created_at')
    .eq('id', id)
    .single();
  if (error) throw error;
  return rowToSlice(data);
}
