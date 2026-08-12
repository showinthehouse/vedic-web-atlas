import { describe, expect, it } from "vitest";
import { withProcessRetry } from "./processRetry";
import { VedicEngineError } from "./vedicEngine";

describe("withProcessRetry", () => {
  it("retries one transient exit and returns the recovered result", async () => {
    let calls = 0;
    const value = await withProcessRetry(
      async () => {
        calls += 1;
        if (calls === 1) throw new VedicEngineError("exit", "temporary");
        return "recovered";
      },
      (error): error is VedicEngineError => error instanceof VedicEngineError && error.kind === "exit",
      { delayMs: 0 },
    );
    expect(value).toBe("recovered");
    expect(calls).toBe(2);
  });

  it("does not retry timeout errors", async () => {
    let calls = 0;
    await expect(withProcessRetry(
      async () => { calls += 1; throw new VedicEngineError("timeout", "slow"); },
      (error): error is VedicEngineError => error instanceof VedicEngineError && error.kind === "exit",
      { delayMs: 0 },
    )).rejects.toMatchObject({ kind: "timeout" });
    expect(calls).toBe(1);
  });

  it("stops after the configured retry limit when every transient attempt fails", async () => {
    let calls = 0;
    await expect(withProcessRetry(
      async () => { calls += 1; throw new VedicEngineError("exit", "temporary"); },
      (error): error is VedicEngineError => error instanceof VedicEngineError && error.kind === "exit",
      { attempts: 2, delayMs: 0 },
    )).rejects.toMatchObject({ kind: "exit" });
    expect(calls).toBe(2);
  });
});
