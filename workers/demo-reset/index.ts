type DemoPerson = { name: string; groupSize: number };
type DemoMeal = {
  date: string;
  type: "breakfast" | "lunch" | "dinner" | "other";
  name: string | null;
  cooks: string | null;
  notes: string | null;
  attendees: string[];
};

const DEMO_SLUG = "demo-meal-planner";
const DEMO_NAME = "Demo Meal Planner";

const PEOPLE: DemoPerson[] = [
  { name: "Mia", groupSize: 1 },
  { name: "Noah", groupSize: 1 },
  { name: "Ava & Ben", groupSize: 2 },
  { name: "Liam", groupSize: 1 },
  { name: "Sofia & Emma", groupSize: 2 },
  { name: "Patel Family", groupSize: 4 },
  { name: "Leo", groupSize: 1 },
  { name: "Grace & Owen", groupSize: 2 }
];

const MEALS: DemoMeal[] = [
  { date: "2026-08-10", type: "breakfast", name: "Yogurt bar and granola", cooks: "Mia", notes: "Set out fruit by 07:30", attendees: ["Mia", "Noah", "Ava & Ben", "Patel Family"] },
  { date: "2026-08-10", type: "dinner", name: "Sheet pan chicken and veggies", cooks: "Noah & Liam", notes: null, attendees: ["Mia", "Noah", "Ava & Ben", "Liam", "Sofia & Emma", "Leo"] },
  { date: "2026-08-11", type: "breakfast", name: "Scrambled eggs and toast", cooks: "Ava & Ben", notes: null, attendees: PEOPLE.map((p) => p.name) },
  { date: "2026-08-11", type: "lunch", name: "Wrap station", cooks: "Sofia & Emma", notes: "Use leftover chicken", attendees: PEOPLE.map((p) => p.name) },
  { date: "2026-08-11", type: "dinner", name: "Taco night", cooks: "Patel Family", notes: "Mild + spicy salsa options", attendees: PEOPLE.map((p) => p.name) },
  { date: "2026-08-12", type: "breakfast", name: "Bagels and cream cheese", cooks: "Leo", notes: null, attendees: ["Mia", "Ava & Ben", "Sofia & Emma", "Patel Family", "Leo", "Grace & Owen"] },
  { date: "2026-08-12", type: "dinner", name: "Mushroom pasta", cooks: "Grace & Owen", notes: null, attendees: ["Mia", "Ava & Ben", "Sofia & Emma", "Patel Family", "Leo", "Grace & Owen"] },
  { date: "2026-08-13", type: "lunch", name: "Caprese sandwiches", cooks: "Mia & Sofia", notes: null, attendees: PEOPLE.map((p) => p.name) },
  { date: "2026-08-13", type: "other", name: "Afternoon snacks", cooks: null, notes: "Chips, fruit, and lemonade", attendees: PEOPLE.map((p) => p.name) },
  { date: "2026-08-14", type: "breakfast", name: "Pancakes", cooks: "Noah", notes: "Maple + berry toppings", attendees: ["Noah", "Liam", "Sofia & Emma", "Patel Family", "Leo", "Grace & Owen"] },
  { date: "2026-08-14", type: "dinner", name: "Grilled fish tacos", cooks: "Liam & Leo", notes: null, attendees: ["Noah", "Liam", "Sofia & Emma", "Patel Family", "Leo", "Grace & Owen"] },
  { date: "2026-08-15", type: "lunch", name: "Falafel bowls", cooks: "Ava & Ben", notes: null, attendees: PEOPLE.map((p) => p.name) },
  { date: "2026-08-15", type: "dinner", name: "Pizza night", cooks: "Everyone", notes: "Two vegetarian pizzas", attendees: PEOPLE.map((p) => p.name) },
  { date: "2026-08-16", type: "breakfast", name: "Croissants and fruit", cooks: "Grace & Owen", notes: null, attendees: PEOPLE.map((p) => p.name) },
  { date: "2026-08-16", type: "lunch", name: "Leftover buffet", cooks: null, notes: null, attendees: PEOPLE.map((p) => p.name) }
];

type Env = {
  DB: D1Database;
};

async function resetDemoBoard(db: D1Database) {
  await db.prepare("INSERT INTO boards (slug, name, board_password_hash) VALUES (?, ?, NULL) ON CONFLICT(slug) DO UPDATE SET name = excluded.name, board_password_hash = NULL")
    .bind(DEMO_SLUG, DEMO_NAME)
    .run();

  const board = await db.prepare("SELECT id FROM boards WHERE slug = ? LIMIT 1").bind(DEMO_SLUG).first<{ id: number }>();
  if (!board) throw new Error("DEMO_BOARD_NOT_FOUND");

  await db.batch([
    db.prepare("DELETE FROM meal_attendees WHERE meal_id IN (SELECT id FROM meals WHERE board_id = ?)").bind(board.id),
    db.prepare("DELETE FROM meals WHERE board_id = ?").bind(board.id),
    db.prepare("DELETE FROM people WHERE board_id = ?").bind(board.id)
  ]);

  for (let i = 0; i < PEOPLE.length; i += 1) {
    const person = PEOPLE[i];
    await db.prepare("INSERT INTO people (board_id, display_name, group_size, active, position) VALUES (?, ?, ?, 1, ?)")
      .bind(board.id, person.name, person.groupSize, i + 1)
      .run();
  }

  const personRows = await db.prepare("SELECT id, display_name FROM people WHERE board_id = ?").bind(board.id).all<{ id: number; display_name: string }>();
  const personIdByName = new Map((personRows.results ?? []).map((p) => [p.display_name, p.id]));

  for (const meal of MEALS) {
    const inserted = await db.prepare("INSERT INTO meals (board_id, meal_date, meal_type, meal_name, cooks_text, notes) VALUES (?, ?, ?, ?, ?, ?) RETURNING id")
      .bind(board.id, meal.date, meal.type, meal.name, meal.cooks, meal.notes)
      .first<{ id: number }>();
    if (!inserted) continue;

    for (const attendeeName of meal.attendees) {
      const personId = personIdByName.get(attendeeName);
      if (!personId) continue;
      await db.prepare("INSERT OR IGNORE INTO meal_attendees (meal_id, person_id) VALUES (?, ?)")
        .bind(inserted.id, personId)
        .run();
    }
  }
}

export default {
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    await resetDemoBoard(env.DB);
  }
};
