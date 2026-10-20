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
