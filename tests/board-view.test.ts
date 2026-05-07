import { describe, expect, it } from "vitest";
import { attendeeWeightedCount, compareMealOrder, expandDateRange } from "../functions/lib/board-view";

describe("board-view helpers", () => {
  it("expands date range including internal empty dates", () => {
    expect(expandDateRange("2026-05-21", "2026-05-24")).toEqual([
      "2026-05-21",
      "2026-05-22",
      "2026-05-23",
      "2026-05-24"
    ]);
  });

  it("sorts meals by date then type then id", () => {
    const sorted = [
      { id: 3, meal_date: "2026-05-21", meal_type: "dinner" as const },
      { id: 1, meal_date: "2026-05-21", meal_type: "unset" as const },
      { id: 2, meal_date: "2026-05-21", meal_type: "breakfast" as const },
      { id: 5, meal_date: "2026-05-22", meal_type: "unset" as const },
      { id: 4, meal_date: "2026-05-21", meal_type: "dinner" as const }
    ].sort(compareMealOrder);

    expect(sorted.map((m) => m.id)).toEqual([2, 3, 4, 1, 5]);
  });

  it("sums weighted attendee counts", () => {
    expect(attendeeWeightedCount([{ group_size: 1 }, { group_size: 2 }, { group_size: 4 }])).toBe(7);
  });
});
