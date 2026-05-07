PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  board_password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS people (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  group_size INTEGER NOT NULL DEFAULT 1 CHECK (group_size >= 1),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_id INTEGER NOT NULL,
  meal_date TEXT NOT NULL,
  meal_type TEXT NOT NULL DEFAULT 'unset' CHECK (meal_type IN ('unset', 'breakfast', 'lunch', 'dinner', 'other')),
  meal_name TEXT,
  cooks_text TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  CHECK (length(meal_date) = 10)
);

CREATE TABLE IF NOT EXISTS meal_attendees (
  meal_id INTEGER NOT NULL,
  person_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (meal_id, person_id),
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE,
  FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_meals_board_date_type_id
  ON meals (board_id, meal_date, meal_type, id);

CREATE INDEX IF NOT EXISTS idx_people_board_active_name
  ON people (board_id, active, display_name);

CREATE TRIGGER IF NOT EXISTS trg_boards_updated_at
AFTER UPDATE ON boards
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE boards
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_meals_updated_at
AFTER UPDATE ON meals
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE meals
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;
