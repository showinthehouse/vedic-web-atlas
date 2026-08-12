import { describe, expect, it } from "vitest";
import { isMissingGenderColumn, withGenderFallback } from "./db";

describe("birth profile gender-schema fallback", () => {
  it("recognizes MySQL missing gender column errors so profile reads can retry with legacy fields", () => {
    expect(isMissingGenderColumn(new Error("Unknown column 'birth_profiles.gender' in 'field list'"))).toBe(true);
    expect(isMissingGenderColumn(new Error("Column 'gender' doesn't exist"))).toBe(true);
  });

  it("does not mask unrelated database failures", () => {
    expect(isMissingGenderColumn(new Error("Access denied for user"))).toBe(false);
    expect(isMissingGenderColumn(new Error("Unknown column 'birth_profiles.notes' in 'field list'"))).toBe(false);
  });

  it("retries the legacy selector and supplies UNSPECIFIED to saved profiles when gender is absent", async () => {
    const profiles = await withGenderFallback(
      async () => { throw new Error("Unknown column 'birth_profiles.gender' in 'field list'"); },
      async () => [{ id: 7, label: "Existing profile" }],
    );
    expect(profiles).toEqual([{ id: 7, label: "Existing profile", gender: "UNSPECIFIED" }]);
  });
});
