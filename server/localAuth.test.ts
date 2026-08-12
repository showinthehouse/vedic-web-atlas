import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./localAuth";

describe("local username/password authentication", () => {
  it("accepts the original password and rejects a different password", async () => {
    const stored = await hashPassword("AtlasTest!2026");
    expect(stored).not.toContain("AtlasTest!2026");
    await expect(verifyPassword("AtlasTest!2026", stored)).resolves.toBe(true);
    await expect(verifyPassword("incorrect-password", stored)).resolves.toBe(false);
  });
});
