import { supabase } from './supabase';
import { editErrorFrom } from './editRules';

// The columns every read asks for, and the row shape the app uses
export const SLICE_COLUMNS = 'id,idx,round,from_name,to_name,to_type,message,color,created_at,edited_at';

export function rowToSlice(row) {
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

export async function fetchSlice(id) {
  const { data, error } = await supabase
    .from('slices')
    .select(SLICE_COLUMNS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return rowToSlice(data);
}

// A failed edit or delete throws an Error whose `reason` is 'forbidden', 'window_closed' or 'other'
function editFailure(error) {
  return Object.assign(new Error(error.message), { reason: editErrorFrom(error) });
}

export async function updateSlice({ id, token, message, fromName, color }) {
  const { data, error } = await supabase.rpc('update_slice', {
    p_id:        id,
    p_token:     token,
    p_message:   message.trim(),
    p_from_name: fromName?.trim() || null,
    p_color:     color,
  });
  if (error) throw editFailure(error);
  return rowToSlice(data);
}

export async function deleteSlice({ id, token }) {
  const { error } = await supabase.rpc('delete_slice', { p_id: id, p_token: token });
  if (error) throw editFailure(error);
}
