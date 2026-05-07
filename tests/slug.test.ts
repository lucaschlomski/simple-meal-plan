import { describe, expect, it } from "vitest";
import { createThreeWordSlug, isReservedSlug } from "../functions/lib/slug";

describe("slug helpers", () => {
  it("creates three-word slug", () => {
    const slug = createThreeWordSlug();
    expect(slug.split("-")).toHaveLength(3);
    expect(/^[a-z]+-[a-z]+-[a-z]+$/.test(slug)).toBe(true);
  });

  it("marks reserved slugs", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("api")).toBe(true);
    expect(isReservedSlug("olive-sunset-river")).toBe(false);
  });
});
