PRAGMA foreign_keys = OFF;

DROP TRIGGER IF EXISTS trg_attendees_delete_touch_board_updated_at;
DROP TRIGGER IF EXISTS trg_attendees_touch_board_updated_at;
DROP TRIGGER IF EXISTS trg_meals_delete_touch_board_updated_at;
DROP TRIGGER IF EXISTS trg_meals_update_touch_board_updated_at;
DROP TRIGGER IF EXISTS trg_meals_touch_board_updated_at;
DROP TRIGGER IF EXISTS trg_people_delete_touch_board_updated_at;
DROP TRIGGER IF EXISTS trg_people_update_touch_board_updated_at;
DROP TRIGGER IF EXISTS trg_people_touch_board_updated_at;
DROP TRIGGER IF EXISTS trg_boards_updated_at;

CREATE TABLE IF NOT EXISTS boards_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  board_password_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TEXT,
  board_admin_password_hash TEXT
);

INSERT INTO boards_new (
  id,
  slug,
  name,
  board_password_hash,
  created_at,
  updated_at,
  last_accessed_at,
  board_admin_password_hash
)
SELECT
  id,
  slug,
  name,
  board_password_hash,
  created_at,
  updated_at,
  last_accessed_at,
  board_admin_password_hash
FROM boards;

DROP TABLE boards;
ALTER TABLE boards_new RENAME TO boards;

CREATE TRIGGER IF NOT EXISTS trg_boards_updated_at
AFTER UPDATE ON boards
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
  AND (
    NEW.name IS NOT OLD.name OR
    NEW.board_password_hash IS NOT OLD.board_password_hash OR
    NEW.board_admin_password_hash IS NOT OLD.board_admin_password_hash
  )
BEGIN
  UPDATE boards
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_people_touch_board_updated_at
AFTER INSERT ON people
FOR EACH ROW
BEGIN
  UPDATE boards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.board_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_people_update_touch_board_updated_at
AFTER UPDATE ON people
FOR EACH ROW
BEGIN
  UPDATE boards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.board_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_people_delete_touch_board_updated_at
AFTER DELETE ON people
FOR EACH ROW
BEGIN
  UPDATE boards SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.board_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_meals_touch_board_updated_at
AFTER INSERT ON meals
FOR EACH ROW
BEGIN
  UPDATE boards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.board_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_meals_update_touch_board_updated_at
AFTER UPDATE ON meals
FOR EACH ROW
BEGIN
  UPDATE boards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.board_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_meals_delete_touch_board_updated_at
AFTER DELETE ON meals
FOR EACH ROW
BEGIN
  UPDATE boards SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.board_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_attendees_touch_board_updated_at
AFTER INSERT ON meal_attendees
FOR EACH ROW
BEGIN
  UPDATE boards
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = (SELECT board_id FROM meals WHERE id = NEW.meal_id);
END;

CREATE TRIGGER IF NOT EXISTS trg_attendees_delete_touch_board_updated_at
AFTER DELETE ON meal_attendees
FOR EACH ROW
BEGIN
  UPDATE boards
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = (SELECT board_id FROM meals WHERE id = OLD.meal_id);
END;

UPDATE boards
SET board_password_hash = NULL
WHERE slug = 'demo-meal-planner';

PRAGMA foreign_keys = ON;
