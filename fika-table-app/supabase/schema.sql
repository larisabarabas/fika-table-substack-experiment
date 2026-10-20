-- ============================================================
-- Fika Table — database schema
-- Run this in the Supabase SQL editor to set up the project
-- ============================================================

CREATE TABLE IF NOT EXISTS slices (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  round      int         NOT NULL DEFAULT 0,
  idx        int         CHECK (idx IS NULL OR (idx >= 0 AND idx <= 11)),
  from_name  text        CHECK (from_name IS NULL OR char_length(from_name) BETWEEN 1 AND 100),
  to_name    text        NOT NULL CHECK (char_length(to_name) BETWEEN 1 AND 100),
  to_type    text        NOT NULL CHECK (to_type IN ('host', 'writer', 'reader', 'friend', 'anyone')),
  message    text        NOT NULL CHECK (char_length(message) BETWEEN 2 AND 1000),
  color      int         NOT NULL CHECK (color BETWEEN 0 AND 7),
  host       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (round, idx)
);

-- Singleton config row: tracks the current round and round size
CREATE TABLE IF NOT EXISTS cake_config (
  id         int  PRIMARY KEY DEFAULT 1,
  round      int  NOT NULL DEFAULT 0,
  round_size int  NOT NULL DEFAULT 12,
  CONSTRAINT cake_config_singleton CHECK (id = 1)
);

-- Seed initial config row
INSERT INTO cake_config (id, round, round_size)
VALUES (1, 0, 12)
ON CONFLICT DO NOTHING;

-- Table-level privileges (RLS policies below only govern row access;
-- the anon role also needs these grants to touch the tables at all)
GRANT SELECT, INSERT ON slices TO anon;
GRANT SELECT ON cake_config TO anon;

-- Row Level Security
ALTER TABLE slices     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cake_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read slices
CREATE POLICY "public read slices"
  ON slices FOR SELECT TO anon USING (true);

-- Visitors can insert non-host slices; 'friend' type now allowed
CREATE POLICY "anon insert visitor slices"
  ON slices FOR INSERT TO anon
  WITH CHECK (
    host = false
    AND char_length(message) >= 2
    AND to_type IN ('host', 'writer', 'reader', 'friend', 'anyone')
  );

-- Anyone can read cake_config (needed to know current round + round_size)
CREATE POLICY "public read cake_config"
  ON cake_config FOR SELECT TO anon USING (true);

-- No anon updates or deletes; host bumps the round from Supabase console
-- (or add a host-only update policy with a bearer token check)

-- ── Manual round reset ─────────────────────────────────────────────────────────
-- Run from the Supabase SQL editor to start a fresh round:
--   SELECT increment_round();
--
CREATE OR REPLACE FUNCTION increment_round()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.cake_config
  SET round = round + 1
  WHERE id = 1;
END;
$$;

-- Enable Realtime (run once after creating tables):
-- ALTER PUBLICATION supabase_realtime ADD TABLE slices;
-- ALTER PUBLICATION supabase_realtime ADD TABLE cake_config;

-- ── Migration from birthday-app schema ────────────────────────────────────────
-- Run these if upgrading an existing database (skip on fresh setup):
--
-- ALTER TABLE slices ADD COLUMN IF NOT EXISTS round int NOT NULL DEFAULT 0;
-- ALTER TABLE slices DROP CONSTRAINT IF EXISTS slices_idx_key;
-- ALTER TABLE slices DROP CONSTRAINT IF EXISTS slices_idx_check;
-- ALTER TABLE slices ADD CONSTRAINT slices_idx_range
--   CHECK (idx IS NULL OR (idx >= 0 AND idx <= 11));
-- ALTER TABLE slices ADD CONSTRAINT slices_round_idx_unique UNIQUE (round, idx);
-- ALTER TABLE slices DROP CONSTRAINT IF EXISTS slices_to_type_check;
-- ALTER TABLE slices ADD CONSTRAINT slices_to_type_check
--   CHECK (to_type IN ('host', 'writer', 'reader', 'friend', 'anyone'));
-- DROP POLICY IF EXISTS "anon insert visitor slices" ON slices;
-- (then re-create with the updated WITH CHECK above)

-- ============================================================
-- Edit and delete your own slice
--
-- There are no accounts, so "your slice" means "whoever holds its secret".
-- give_slice creates a slice and returns a random edit token once; only the
-- token's SHA-256 hash is stored, in slice_secrets. update_slice and
-- delete_slice take the slice id plus that token.
--
-- Slices given before this migration have no secret, so they stay as they are.
-- ============================================================

-- Public: lets the wall and the recipient page show an "edited" marker.
ALTER TABLE slices ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- Kept out of `slices` on purpose: that table is published over Realtime, which
-- sends whole rows to every visitor. No policies and no grants for anon: only the
-- SECURITY DEFINER functions below can read or write it.
CREATE TABLE IF NOT EXISTS slice_secrets (
  slice_id   uuid  PRIMARY KEY REFERENCES slices(id) ON DELETE CASCADE,
  token_hash bytea NOT NULL
);
ALTER TABLE slice_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON slice_secrets FROM anon, authenticated;

-- ── give_slice ─────────────────────────────────────────────────────────────────
-- Same rules as the direct insert (the table CHECKs and UNIQUE (round, idx) still
-- apply, so a taken slice still fails with 23505), plus the current round comes
-- from cake_config instead of the caller. Returns the slice row as json, plus
-- `edit_token`: the only time the token is ever shown.
CREATE OR REPLACE FUNCTION give_slice(
  p_idx       int,
  p_from_name text,
  p_to_name   text,
  p_to_type   text,
  p_message   text,
  p_color     int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
  v_row   public.slices;
BEGIN
  INSERT INTO public.slices (round, idx, from_name, to_name, to_type, message, color, host)
  VALUES (
    (SELECT round FROM public.cake_config WHERE id = 1),
    p_idx,
    nullif(btrim(p_from_name), ''),
    btrim(p_to_name),
    p_to_type,
    btrim(p_message),
    p_color,
    false
  )
  RETURNING * INTO v_row;

  INSERT INTO public.slice_secrets (slice_id, token_hash)
  VALUES (v_row.id, sha256(convert_to(v_token, 'utf8')));

  RETURN to_jsonb(v_row) || jsonb_build_object('edit_token', v_token);
END;
$$;

-- ── update_slice ───────────────────────────────────────────────────────────────
-- Message, signature and icing color only. The recipient cannot change: it drives
-- the Note link, and the giver may already have posted that Note.
-- Editable for 24 hours after the slice was given (the recipient may have read it
-- by then); delete_slice has no such limit.
-- Errors (RAISE, SQLSTATE P0001): 'forbidden' for a wrong token or an unknown id
-- (deliberately the same, so ids cannot be probed), 'window_closed' after 24 hours.
CREATE OR REPLACE FUNCTION update_slice(
  p_id        uuid,
  p_token     text,
  p_message   text,
  p_from_name text,
  p_color     int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_row     public.slices;
  v_message text := btrim(p_message);
  v_from    text := nullif(btrim(p_from_name), '');
BEGIN
  SELECT s.* INTO v_row
  FROM public.slices s
  JOIN public.slice_secrets k ON k.slice_id = s.id
  WHERE s.id = p_id
    AND k.token_hash = sha256(convert_to(p_token, 'utf8'))
  FOR UPDATE OF s;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF v_row.created_at < now() - interval '24 hours' THEN
    RAISE EXCEPTION 'window_closed';
  END IF;

  UPDATE public.slices
  SET message   = v_message,
      from_name = v_from,
      color     = p_color,
      -- a new color alone is not worth an "edited" marker
      edited_at = CASE
        WHEN v_message IS DISTINCT FROM message OR v_from IS DISTINCT FROM from_name THEN now()
        ELSE edited_at
      END
  WHERE id = p_id
  RETURNING * INTO v_row;

  RETURN to_jsonb(v_row);
END;
$$;

-- ── delete_slice ───────────────────────────────────────────────────────────────
-- Takes the slice off the wall and frees its place on the cake. Any time.
CREATE OR REPLACE FUNCTION delete_slice(p_id uuid, p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.slices s
  USING public.slice_secrets k
  WHERE s.id = p_id
    AND k.slice_id = s.id
    AND k.token_hash = sha256(convert_to(p_token, 'utf8'));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
END;
$$;

-- Functions are executable by PUBLIC unless revoked
REVOKE ALL ON FUNCTION give_slice(int, text, text, text, text, int)   FROM PUBLIC;
REVOKE ALL ON FUNCTION update_slice(uuid, text, text, text, int)      FROM PUBLIC;
REVOKE ALL ON FUNCTION delete_slice(uuid, text)                       FROM PUBLIC;
GRANT EXECUTE ON FUNCTION give_slice(int, text, text, text, text, int) TO anon;
GRANT EXECUTE ON FUNCTION update_slice(uuid, text, text, text, int)    TO anon;
GRANT EXECUTE ON FUNCTION delete_slice(uuid, text)                     TO anon;

-- Not done here: the anon INSERT grant and policy on slices stay, so the app keeps
-- working until it switches to give_slice. Revoke them in the same change as that
-- switch, so nothing can create a slice that skips the function (and its secret).

-- ============================================================
-- Slices are created through give_slice only
--
-- give_slice (migration 2) is the one path that also creates the slice's secret,
-- so a direct insert would leave a slice nobody can edit or delete. The app now
-- calls give_slice; close the old door. Reads are unchanged.
-- Run this together with, or after, the app version that calls give_slice.
-- ============================================================

DROP POLICY IF EXISTS "anon insert visitor slices" ON slices;
REVOKE INSERT ON slices FROM anon;
