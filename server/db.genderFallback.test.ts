import { describe, expect, it } from "vitest";
import { DatabaseUnavailableError, isMissingGenderColumn, isTransientDatabaseError, toSafeDatabaseError, withGenderFallback } from "./db";

describe("birth profile gender-schema fallback", () => {
  it("recognizes MySQL missing gender column errors so profile reads can retry with legacy fields", () => {
    expect(isMissingGenderColumn(new Error("Unknown column 'birth_profiles.gender' in 'field list'"))).toBe(true);
    expect(isMissingGenderColumn(new Error("Column 'gender' doesn't exist"))).toBe(true);
    expect(isMissingGenderColumn(new Error("Failed query: select `id`, `gender` from `birth_profiles` where `birth_profiles`.`userId` = ?\nparams: 1"))).toBe(true);
    expect(isMissingGenderColumn(Object.assign(new Error("Failed query: select `gender` from `birth_profiles`"), { cause: new Error("Unknown column 'gender' in 'field list'") }))).toBe(true);
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

  it("recognizes DNS and connection blips as retryable without classifying schema errors as transient", () => {
    expect(isTransientDatabaseError(new Error("ERROR 2005 (HY000): Unknown MySQL server host 'gateway' (-3)"))).toBe(true);
    expect(isTransientDatabaseError(new Error("connect ETIMEDOUT"))).toBe(true);
    expect(isTransientDatabaseError(new Error("read ECONNRESET"))).toBe(true);
    expect(isTransientDatabaseError(new Error("Unknown column 'gender' in 'field list'"))).toBe(false);
  });

  it("converts final transient database failures to a Chinese safe error while retaining domain errors", () => {
    const safe = toSafeDatabaseError(new Error("connect ETIMEDOUT"));
    expect(safe).toBeInstanceOf(DatabaseUnavailableError);
    expect((safe as Error).message).toBe("数据库连接暂时不稳定，请稍后重试。");
    const domainError = new Error("Duplicate entry");
    expect(toSafeDatabaseError(domainError)).toBe(domainError);
  });
});
