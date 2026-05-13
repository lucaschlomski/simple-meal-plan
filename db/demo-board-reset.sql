PRAGMA foreign_keys = ON;

INSERT INTO boards (slug, name, board_password_hash)
VALUES ('demo-meal-planner', 'Demo Meal Planner', NULL)
ON CONFLICT(slug) DO UPDATE SET
  name = excluded.name,
  board_password_hash = NULL;

UPDATE boards
SET board_admin_password_hash = NULL
WHERE slug = 'demo-meal-planner';

DELETE FROM meal_attendees
WHERE meal_id IN (
  SELECT id FROM meals WHERE board_id = (SELECT id FROM boards WHERE slug = 'demo-meal-planner')
);

DELETE FROM meals
WHERE board_id = (SELECT id FROM boards WHERE slug = 'demo-meal-planner');

DELETE FROM people
WHERE board_id = (SELECT id FROM boards WHERE slug = 'demo-meal-planner');

INSERT INTO people (board_id, display_name, group_size, active, position)
VALUES
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), 'Mia', 1, 1, 1),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), 'Noah', 1, 1, 2),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), 'Ava & Ben', 2, 1, 3),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), 'Liam', 1, 1, 4),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), 'Sofia & Emma', 2, 1, 5),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), 'Patel Family', 4, 1, 6),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), 'Leo', 1, 1, 7),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), 'Grace & Owen', 2, 1, 8);

INSERT INTO meals (board_id, meal_date, meal_type, meal_name, cooks_text, notes)
VALUES
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-10', 'breakfast', 'Yogurt bar and granola', 'Mia', 'Set out fruit by 07:30'),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-10', 'dinner', 'Sheet pan chicken and veggies', 'Noah & Liam', NULL),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-11', 'breakfast', 'Scrambled eggs and toast', 'Ava & Ben', NULL),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-11', 'lunch', 'Wrap station', 'Sofia & Emma', 'Use leftover chicken'),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-11', 'dinner', 'Taco night', 'Patel Family', 'Mild + spicy salsa options'),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-12', 'breakfast', 'Bagels and cream cheese', 'Leo', NULL),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-12', 'dinner', 'Mushroom pasta', 'Grace & Owen', NULL),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-13', 'lunch', 'Caprese sandwiches', 'Mia & Sofia', NULL),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-13', 'other', 'Afternoon snacks', NULL, 'Chips, fruit, and lemonade'),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-14', 'breakfast', 'Pancakes', 'Noah', 'Maple + berry toppings'),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-14', 'dinner', 'Grilled fish tacos', 'Liam & Leo', NULL),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-15', 'lunch', 'Falafel bowls', 'Ava & Ben', NULL),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-15', 'dinner', 'Pizza night', 'Everyone', 'Two vegetarian pizzas'),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-16', 'breakfast', 'Croissants and fruit', 'Grace & Owen', NULL),
  ((SELECT id FROM boards WHERE slug = 'demo-meal-planner'), '2026-08-16', 'lunch', 'Leftover buffet', NULL, NULL);

INSERT INTO meal_attendees (meal_id, person_id)
SELECT m.id, p.id
FROM meals m
JOIN boards b ON b.id = m.board_id
JOIN people p ON p.board_id = b.id
WHERE b.slug = 'demo-meal-planner'
  AND m.meal_date = '2026-08-10'
  AND m.meal_type = 'breakfast'
  AND p.display_name IN ('Mia', 'Noah', 'Ava & Ben', 'Patel Family');

INSERT INTO meal_attendees (meal_id, person_id)
SELECT m.id, p.id
FROM meals m
JOIN boards b ON b.id = m.board_id
JOIN people p ON p.board_id = b.id
WHERE b.slug = 'demo-meal-planner'
  AND m.meal_date = '2026-08-10'
  AND m.meal_type = 'dinner'
  AND p.display_name IN ('Mia', 'Noah', 'Ava & Ben', 'Liam', 'Sofia & Emma', 'Leo');

INSERT INTO meal_attendees (meal_id, person_id)
SELECT m.id, p.id
FROM meals m
JOIN boards b ON b.id = m.board_id
JOIN people p ON p.board_id = b.id
WHERE b.slug = 'demo-meal-planner'
  AND m.meal_date = '2026-08-11'
  AND m.meal_type IN ('breakfast', 'lunch', 'dinner')
  AND p.display_name IN ('Mia', 'Noah', 'Ava & Ben', 'Liam', 'Sofia & Emma', 'Patel Family', 'Leo', 'Grace & Owen');

INSERT INTO meal_attendees (meal_id, person_id)
SELECT m.id, p.id
FROM meals m
JOIN boards b ON b.id = m.board_id
JOIN people p ON p.board_id = b.id
WHERE b.slug = 'demo-meal-planner'
  AND m.meal_date = '2026-08-12'
  AND m.meal_type IN ('breakfast', 'dinner')
  AND p.display_name IN ('Mia', 'Ava & Ben', 'Sofia & Emma', 'Patel Family', 'Leo', 'Grace & Owen');

INSERT INTO meal_attendees (meal_id, person_id)
SELECT m.id, p.id
FROM meals m
JOIN boards b ON b.id = m.board_id
JOIN people p ON p.board_id = b.id
WHERE b.slug = 'demo-meal-planner'
  AND m.meal_date = '2026-08-13'
  AND m.meal_type IN ('lunch', 'other')
  AND p.display_name IN ('Mia', 'Noah', 'Ava & Ben', 'Liam', 'Sofia & Emma', 'Patel Family', 'Leo', 'Grace & Owen');

INSERT INTO meal_attendees (meal_id, person_id)
SELECT m.id, p.id
FROM meals m
JOIN boards b ON b.id = m.board_id
JOIN people p ON p.board_id = b.id
WHERE b.slug = 'demo-meal-planner'
  AND m.meal_date = '2026-08-14'
  AND m.meal_type IN ('breakfast', 'dinner')
  AND p.display_name IN ('Noah', 'Liam', 'Sofia & Emma', 'Patel Family', 'Leo', 'Grace & Owen');

INSERT INTO meal_attendees (meal_id, person_id)
SELECT m.id, p.id
FROM meals m
JOIN boards b ON b.id = m.board_id
JOIN people p ON p.board_id = b.id
WHERE b.slug = 'demo-meal-planner'
  AND m.meal_date = '2026-08-15'
  AND m.meal_type IN ('lunch', 'dinner')
  AND p.display_name IN ('Mia', 'Noah', 'Ava & Ben', 'Liam', 'Sofia & Emma', 'Patel Family', 'Leo', 'Grace & Owen');

INSERT INTO meal_attendees (meal_id, person_id)
SELECT m.id, p.id
FROM meals m
JOIN boards b ON b.id = m.board_id
JOIN people p ON p.board_id = b.id
WHERE b.slug = 'demo-meal-planner'
  AND m.meal_date = '2026-08-16'
  AND m.meal_type IN ('breakfast', 'lunch')
  AND p.display_name IN ('Mia', 'Noah', 'Ava & Ben', 'Liam', 'Sofia & Emma', 'Patel Family', 'Leo', 'Grace & Owen');
