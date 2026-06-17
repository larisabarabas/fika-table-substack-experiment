-- ============================================================
-- Have a Slice — database schema
-- Run this in the Supabase SQL editor to set up the project
-- ============================================================

CREATE TABLE IF NOT EXISTS slices (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  idx        int         UNIQUE CHECK (idx IS NULL OR idx BETWEEN 0 AND 29),
  from_name  text        CHECK (from_name IS NULL OR char_length(from_name) BETWEEN 1 AND 100),
  to_name    text        NOT NULL CHECK (char_length(to_name) BETWEEN 1 AND 100),
  to_type    text        NOT NULL CHECK (to_type IN ('host', 'writer', 'reader', 'anyone')),
  message    text        NOT NULL CHECK (char_length(message) BETWEEN 2 AND 1000),
  color      int         NOT NULL CHECK (color BETWEEN 0 AND 7),
  host       boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE slices ENABLE ROW LEVEL SECURITY;

-- Anyone can read all slices
CREATE POLICY "public read slices"
  ON slices FOR SELECT
  TO anon
  USING (true);

-- Visitors can only insert non-host slices
CREATE POLICY "anon insert visitor slices"
  ON slices FOR INSERT
  TO anon
  WITH CHECK (
    host = false
    AND char_length(message) >= 2
    AND to_type IN ('host', 'writer', 'reader', 'anyone')
  );

-- No anon updates or deletes (host rows managed via Supabase console only)

-- Enable Realtime for live wall updates
-- Run this once after creating the table:
-- ALTER PUBLICATION supabase_realtime ADD TABLE slices;

-- If applying length constraints to an existing table, run these in the SQL editor:
-- ALTER TABLE slices ADD CONSTRAINT from_name_len CHECK (from_name IS NULL OR char_length(from_name) BETWEEN 1 AND 100);
-- ALTER TABLE slices ADD CONSTRAINT to_name_len   CHECK (char_length(to_name) BETWEEN 1 AND 100);
-- ALTER TABLE slices ADD CONSTRAINT message_len   CHECK (char_length(message) BETWEEN 2 AND 1000);
