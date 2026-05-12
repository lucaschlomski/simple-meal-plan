ALTER TABLE boards ADD COLUMN last_accessed_at TEXT;
ALTER TABLE boards ADD COLUMN board_admin_password_hash TEXT;

DROP TRIGGER IF EXISTS trg_boards_updated_at;

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
