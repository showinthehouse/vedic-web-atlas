import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { getPythonExecutable } from "./pythonRuntime";

describe("offline city lookup", () => {
  it("uses the bundled CSV and returns Chennai without a GitHub download", () => {
    const scriptPath = new URL("../scripts/city_lookup.py", import.meta.url).pathname;
    const result = spawnSync(getPythonExecutable(), [scriptPath], {
      input: JSON.stringify({ action: "search", query: "Chennai" }),
      encoding: "utf8",
      env: { ...process.env, PYTHONWARNINGS: "ignore::SyntaxWarning" },
      timeout: 10_000,
    });

    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain("github.com/naturalstupid/JHora_World_data");
    expect(result.stderr).toContain("geonames_places_5k.csv");

    const payload = JSON.parse(result.stdout) as { results: Array<{ description: string; latitude: number; longitude: number }> };
    expect(payload.results.some(place => place.description.includes("Chennai") && place.latitude === 13.0878 && place.longitude === 80.2785)).toBe(true);
  });
});
