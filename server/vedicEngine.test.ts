import { describe, expect, it } from "vitest";
import { calculateVedicChart } from "./vedicEngine";

describe("vedic calculation engine", () => {
  it("calculates real birth-chart, panchanga, dasa and transit data from PyJHora", async () => {
    const result = await calculateVedicChart({
      date: "1996-12-07",
      time: "10:34",
      placeName: "Chennai, India",
      latitude: 13.0878,
      longitude: 80.2785,
      timezone: 5.5,
      calendar: "GREGORIAN",
      ayanamsa: "LAHIRI",
      divisionalFactor: 9,
    }) as {
      engine: { license: string };
      rasi: { body: string; sign: string }[];
      navamsa: { body: string; sign: string }[];
      panchanga: { nakshatra: { name: string }; sunrise: string };
      vimsottari: { lord: string; years: number }[];
      shadbala: { planet: string; rupas: number }[];
      sarvashtakavarga: { sign: string; points: number }[];
      transits: { body: string }[];
    };

    expect(result.engine.license).toBe("AGPL-3.0");
    expect(result.rasi.find(item => item.body === "Ascendant")?.sign).toBe("Capricorn");
    expect(result.navamsa.find(item => item.body === "Ascendant")?.sign).toBe("Cancer");
    expect(result.panchanga.nakshatra.name).toBe("Swati");
    expect(result.panchanga.sunrise).toMatch(/^\d{2}:\d{2}/);
    expect(result.vimsottari[0]).toMatchObject({ lord: "Rahu", years: 18 });
    expect(result.shadbala).toHaveLength(7);
    expect(result.shadbala.find(item => item.planet === "Sun")?.rupas).toBeGreaterThan(0);
    expect(result.sarvashtakavarga).toHaveLength(12);
    expect(result.sarvashtakavarga.reduce((sum, item) => sum + item.points, 0)).toBe(337);
    expect(result.transits).toHaveLength(10);
  }, 30_000);
});
