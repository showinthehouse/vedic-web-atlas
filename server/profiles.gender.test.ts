import { afterEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";
import type { TrpcContext } from "./_core/context";

function authenticatedContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "profile-test-user",
      email: null,
      name: null,
      username: null,
      passwordHash: null,
      loginMethod: "local",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("profiles.list gender contract", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns a persisted-or-fallback gender value to an authenticated caller", async () => {
    vi.spyOn(db, "listBirthProfiles").mockResolvedValue([{
      id: 8,
      userId: 1,
      label: "Existing profile",
      birthDate: "1996-12-07",
      birthTime: "10:34",
      gender: "UNSPECIFIED",
      calendar: "GREGORIAN",
      placeName: "Chennai, India",
      latitude: "13.087800",
      longitude: "80.278500",
      timezone: "5.50",
      timeZoneId: "Asia/Kolkata",
      ayanamsa: "LAHIRI",
      divisionalFactor: 1,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }]);

    const result = await appRouter.createCaller(authenticatedContext()).profiles.list();

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 8, userId: 1, gender: "UNSPECIFIED" });
    expect(db.listBirthProfiles).toHaveBeenCalledWith(1);
  });

  it("passes the safe Chinese database-unavailable message through the protected list route", async () => {
    vi.spyOn(db, "listBirthProfiles").mockRejectedValue(new db.DatabaseUnavailableError());

    await expect(appRouter.createCaller(authenticatedContext()).profiles.list())
      .rejects.toThrow("数据库连接暂时不稳定，请稍后重试。");
    expect(db.listBirthProfiles).toHaveBeenCalledWith(1);
  });
});
