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
