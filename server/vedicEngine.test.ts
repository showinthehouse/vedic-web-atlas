import { describe, expect, it } from "vitest";
import { calculateVedicChart, calculateVedicCompatibility, type VedicInput } from "./vedicEngine";

const chennai: VedicInput = {
  date: "1996-12-07", time: "10:34", placeName: "Chennai, India", latitude: 13.0878,
  longitude: 80.2785, timezone: 5.5, calendar: "GREGORIAN", ayanamsa: "LAHIRI", divisionalFactor: 9,
};

describe("vedic calculation engine", () => {
  it("calculates real birth-chart, panchanga, dasa and transit data from PyJHora", async () => {
    const result = await calculateVedicChart(chennai) as {
      engine: { license: string };
      rasi: { body: string; sign: string }[];
      navamsa: { body: string; sign: string }[];
      panchanga: { nakshatra: { name: string }; sunrise: string };
      vimsottari: { lord: string; years: number }[];
      shadbala: { planet: string; rupas: number }[];
      sarvashtakavarga: { sign: string; points: number }[];
      transits: { body: string }[];
      fineDasa: { maha: string; bhukti: string; antara: string; antaras: { lord: string; current: boolean }[] };
      muhurta: { abhijit: string[]; rahuKalam: string[]; yamaganda: string[] };
      yogas: { name: string; matched: boolean; rule: string }[];
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
    expect(result.fineDasa.antaras).toHaveLength(9);
    expect(result.fineDasa.antaras.filter(item => item.current)).toHaveLength(1);
    expect(result.muhurta.abhijit).toHaveLength(2);
    expect(result.muhurta.rahuKalam).toHaveLength(2);
    expect(result.muhurta.yamaganda).toHaveLength(2);
    expect(result.yogas.every(item => item.matched && item.rule.length > 0)).toBe(true);
  }, 30_000);

  it("calculates a bounded real Ashta Koota score for two birth inputs", async () => {
    const newYork: VedicInput = { date: "2000-01-01", time: "12:00", placeName: "New York, USA", latitude: 40.7128, longitude: -74.006, timezone: -5, calendar: "GREGORIAN", ayanamsa: "LAHIRI", divisionalFactor: 1 };
    const result = await calculateVedicCompatibility(chennai, newYork) as { compatibility: { score: number; maximum: number; components: { name: string; score: number }[] } };
    expect(result.compatibility.maximum).toBe(36);
    expect(result.compatibility.score).toBeGreaterThanOrEqual(0);
    expect(result.compatibility.score).toBeLessThanOrEqual(36);
    expect(result.compatibility.components).toHaveLength(8);
  }, 30_000);
});
