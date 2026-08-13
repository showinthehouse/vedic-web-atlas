import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { getPythonExecutable } from "./pythonRuntime";

describe("China city lookup", () => {
  it("returns Beijing from the lightweight local index without PyJHora startup overhead", () => {
    const scriptPath = new URL("../scripts/china_city_lookup.py", import.meta.url).pathname;
    const startedAt = Date.now();
    const result = spawnSync(getPythonExecutable(), [scriptPath], {
      input: JSON.stringify({ action: "search", query: "Beijing" }),
      encoding: "utf8",
      timeout: 3_000,
    });
    const elapsedMs = Date.now() - startedAt;

    expect(result.status).toBe(0);
    expect(elapsedMs).toBeLessThan(1_000);
    expect(result.stderr).toBe("");

    const payload = JSON.parse(result.stdout) as { results: Array<{ description: string; latitude: number; longitude: number; placeId: string }> };
    expect(payload.results).toContainEqual(expect.objectContaining({
      description: "Beijing, Beijing, China",
      latitude: 39.9075,
      longitude: 116.39723,
    }));
    expect(payload.results[0]?.placeId).toMatch(/^china:/);
  });

  it("supports Chinese aliases for major Chinese cities", () => {
    const scriptPath = new URL("../scripts/china_city_lookup.py", import.meta.url).pathname;
    const result = spawnSync(getPythonExecutable(), [scriptPath], {
      input: JSON.stringify({ action: "search", query: "北京" }),
      encoding: "utf8",
      timeout: 3_000,
    });
    expect(result.status).toBe(0);
    const payload = JSON.parse(result.stdout) as { results: Array<{ description: string; latitude: number; longitude: number }> };
    expect(payload.results).toContainEqual(expect.objectContaining({
      description: "北京 · Beijing, Beijing, China",
      latitude: 39.9075,
      longitude: 116.39723,
    }));
  });
});
