import { describe, expect, it } from "vitest";
import { normalizeCalendarDate, normalizeClockTime } from "../client/src/lib/dateInput";

describe("date input normalization", () => {
  it("normalizes valid calendar dates and rejects incomplete or impossible dates", () => {
    expect(normalizeCalendarDate("1996-12-07")).toBe("1996-12-07");
    expect(normalizeCalendarDate("2000-2-29")).toBe("2000-02-29");
    expect(normalizeCalendarDate("2001-02-29")).toBeNull();
    expect(normalizeCalendarDate("12/07/1996")).toBeNull();
    expect(normalizeCalendarDate("1996-12")).toBeNull();
  });

  it("normalizes valid local times and rejects incomplete values", () => {
    expect(normalizeClockTime("9:05")).toBe("09:05");
    expect(normalizeClockTime("10:34")).toBe("10:34");
    expect(normalizeClockTime("24:00")).toBeNull();
    expect(normalizeClockTime("10")).toBeNull();
  });
});
