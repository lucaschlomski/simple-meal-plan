PRAGMA foreign_keys = ON;

-- Adds an explicit position to support manual reordering of people / groups
-- inside a board. New rows get MAX(position) + 1 on insert. The unique-per-
-- board constraint isn't enforced at the schema level (a stale row with the
-- same position is harmless because (position, id) is the canonical sort) but
-- the move endpoint is responsible for keeping positions distinct.

ALTER TABLE people ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

-- Backfill: existing rows get their id as the initial position, preserving
-- whatever order was previously visible (id-asc).
UPDATE people SET position = id;

CREATE INDEX IF NOT EXISTS idx_people_board_position
  ON people (board_id, position);
