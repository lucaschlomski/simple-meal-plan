-- DEV ONLY — do not run against production D1.
-- Creates a demo board with known password "demo123".
-- Production boards are created via the /admin UI at runtime.

PRAGMA foreign_keys = ON;

INSERT INTO boards (slug, name, board_password_hash)
VALUES ('echo-harbor-amber', 'Summer Getaway 2026', 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791')
ON CONFLICT(slug) DO UPDATE SET
  name = excluded.name,
  board_password_hash = excluded.board_password_hash;

INSERT OR IGNORE INTO people (id, board_id, display_name, group_size, active)
VALUES
  (1, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), 'Alex', 1, 1),
  (2, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), 'Sam', 1, 1),
  (3, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), 'Dana & Taylor', 2, 1),
  (4, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), 'Casey', 1, 1),
  (5, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), 'Riley & Quinn', 2, 1),
  (6, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), 'Morgan Family', 4, 1),
  (7, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), 'Jordan', 1, 1),
  (8, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), 'Reese & Kai', 2, 1);

INSERT OR IGNORE INTO meals (id, board_id, meal_date, meal_type, meal_name, cooks_text)
VALUES
  (1, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), '2026-07-13', 'dinner', 'Grilled lemon herb chicken',       'Alex'),
  (2, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), '2026-07-14', 'breakfast', 'Pancakes with fresh berries',     'Sam & Riley'),
  (3, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), '2026-07-14', 'dinner',    'Tacos al pastor',                  'Casey & Jordan'),
  (4, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), '2026-07-15', 'lunch',     'Caprese sandwiches',               'Dana'),
  (5, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), '2026-07-15', 'dinner',    'BBQ pulled pork sliders',           'Morgan Family'),
  (6, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), '2026-07-16', 'breakfast', 'Croissants and jam',               'Kai'),
  (7, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), '2026-07-16', 'dinner',    'Mushroom risotto',                  'Quinn'),
  (8, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), '2026-07-17', 'lunch',     'Greek salad bowls',                 'Taylor'),
  (9, (SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), '2026-07-17', 'other',     'Ice cream sundae bar',              NULL),
  (10,(SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), '2026-07-18', 'breakfast', NULL,                               NULL),
  (11,(SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), '2026-07-18', 'dinner',    'Seafood paella',                    'Alex & Jordan'),
  (12,(SELECT id FROM boards WHERE slug = 'echo-harbor-amber'), '2026-07-19', 'lunch',     'Falafel wraps with tzatziki',       'Riley');

INSERT OR IGNORE INTO meal_attendees (meal_id, person_id) VALUES
  (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 7), (1, 8),
  (2, 2), (2, 5), (2, 4), (2, 6),
  (3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7), (3, 8),
  (4, 3), (4, 4), (4, 5), (4, 7),
  (5, 1), (5, 2), (5, 4), (5, 6), (5, 7), (5, 8),
  (6, 6), (6, 8), (6, 1), (6, 2),
  (7, 1), (7, 3), (7, 5), (7, 7),
  (8, 3), (8, 4), (8, 5),
  (9, 1), (9, 2), (9, 3), (9, 4), (9, 5), (9, 6), (9, 7), (9, 8),
  (11, 1), (11, 2), (11, 4), (11, 5), (11, 6), (11, 7);
