import { describe, expect, it } from "vitest";
import { calculateVedicChart, calculateVedicCompatibility, type VedicInput } from "./vedicEngine";

const chennai: VedicInput = {
  date: "1996-12-07", time: "10:34", placeName: "Chennai, India", latitude: 13.0878,
  longitude: 80.2785, timezone: 5.5, calendar: "GREGORIAN", ayanamsa: "LAHIRI", divisionalFactor: 9,
};

describe("vedic calculation engine", () => {
  it("calculates real birth-chart, panchanga, dasa and transit data from PyJHora", async () => {
    const result = await calculateVedicChart(chennai) as {
      engine: { license: string; ayanamsaValue: number; zodiac: string };
      input: { gender: string };
      rasi: { body: string; sign: string }[];
      navamsa: { body: string; sign: string }[];
      panchanga: { nakshatra: { name: string; lord: string; percentLeft: number }; yoga: { name: string }; karana: { name: string }; lunarMonth: { name: string }; sunrise: string; dayLength: string };
      vimsottari: { lord: string; years: number }[];
      dasaTimeline: { nodes: { lord: string; children: { children: unknown[] }[]; current: boolean }[]; currentPath: string[]; source: { url: string } };
      shadbala: { planet: string; rupas: number }[];
      sarvashtakavarga: { sign: string; points: number }[];
      transits: { body: string }[];
      fineDasa: { maha: string; bhukti: string; antara: string; antaras: { lord: string; current: boolean }[] };
      muhurta: { abhijit: string[]; rahuKalam: string[]; yamaganda: string[] };
      yogas: { name: string; matched: boolean; rule: string }[];
      yogaMeta: { catalogCount: number; matchedCount: number; sources: { url: string }[] };
      charaKarakas: { karaka: string; planet: string }[];
      specialLagnas: { body: string; house: number; nakshatra: { name: string } }[];
      solarUpagrahas: { body: string; sign: string }[];
      traditionalPoints: { body: string; sign: string; house: number }[];
      traditionalConfig: { enabled: boolean; varnadaMethod: number; varnadaMethodName: string };
      divisions: { factor: number; items: { body: string; house: number }[] }[];
      bhinnaAshtakavarga: { body: string; points: number[]; total: number }[];
    };

    expect(result.engine.license).toBe("AGPL-3.0");
    expect(result.engine.zodiac).toBe("Sidereal");
    expect(result.engine.ayanamsaValue).toBeGreaterThan(20);
    expect(result.rasi.find(item => item.body === "Ascendant")?.sign).toBe("Capricorn");
    expect(result.navamsa.find(item => item.body === "Ascendant")?.sign).toBe("Cancer");
    expect(result.panchanga.nakshatra.name).toBe("Swati");
    expect(result.panchanga.nakshatra.lord).toBe("Rahu");
    expect(result.panchanga.nakshatra.percentLeft).toBeGreaterThan(0);
    expect(result.panchanga.yoga.name.length).toBeGreaterThan(0);
    expect(result.panchanga.karana.name.length).toBeGreaterThan(0);
    expect(result.panchanga.lunarMonth.name.length).toBeGreaterThan(0);
    expect(result.panchanga.dayLength).toMatch(/^\d{2}:\d{2}$/);
    expect(result.panchanga.sunrise).toMatch(/^\d{2}:\d{2}/);
    expect(result.vimsottari[0]).toMatchObject({ lord: "Rahu", years: 18 });
    expect(result.input.gender).toBe("UNSPECIFIED");
    expect(result.dasaTimeline.nodes).toHaveLength(9);
    expect(result.dasaTimeline.nodes.every(node => node.children.length === 9 && node.children.every(child => child.children.length === 9))).toBe(true);
    expect(result.dasaTimeline.currentPath).toHaveLength(3);
    expect(result.dasaTimeline.source.url).toContain("vimsottari.py");
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
    expect(result.yogaMeta.catalogCount).toBeGreaterThan(280);
    expect(result.yogaMeta.matchedCount).toBe(result.yogas.length);
    expect(result.yogaMeta.sources.every(source => source.url.includes("PyJHora"))).toBe(true);
    expect(result.charaKarakas).toHaveLength(8);
    expect(result.charaKarakas[0]).toMatchObject({ karaka: "Atma Karaka" });
    expect(result.specialLagnas).toHaveLength(9);
    expect(result.specialLagnas.every(item => item.house >= 1 && item.house <= 12 && item.nakshatra.name.length > 0)).toBe(true);
    expect(result.solarUpagrahas).toHaveLength(5);
    expect(result.traditionalPoints.map(item => item.body)).toEqual(["Varnada Lagna", "Yogi Sphuta", "Avayogi Sphuta"]);
    expect(result.traditionalPoints.every(item => item.house >= 1 && item.house <= 12)).toBe(true);
    expect(result.traditionalConfig).toMatchObject({ enabled: true, varnadaMethod: 1, varnadaMethodName: "B. V. Raman" });
    expect(result.divisions.map(item => item.factor)).toEqual([1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60]);
    expect(result.divisions.every(item => item.items.length === 10)).toBe(true);
    expect(result.bhinnaAshtakavarga).toHaveLength(8);
    expect(result.bhinnaAshtakavarga.every(item => item.points.length === 12 && item.total === item.points.reduce((sum, point) => sum + point, 0))).toBe(true);
  }, 30_000);

  it("calculates a bounded real Ashta Koota score for two birth inputs", async () => {
    const newYork: VedicInput = { date: "2000-01-01", time: "12:00", gender: "FEMALE", placeName: "New York, USA", latitude: 40.7128, longitude: -74.006, timezone: -5, calendar: "GREGORIAN", ayanamsa: "LAHIRI", divisionalFactor: 1 };
    const result = await calculateVedicCompatibility({ ...chennai, gender: "MALE" }, newYork) as { compatibility: { score: number; maximum: number; components: { name: string; score: number; maximum: number }[]; additional: unknown[]; direction: { mode: string; boyProfile: string; girlProfile: string } } };
    expect(result.compatibility.maximum).toBe(36);
    expect(result.compatibility.score).toBeGreaterThanOrEqual(0);
    expect(result.compatibility.score).toBeLessThanOrEqual(36);
    expect(result.compatibility.components).toHaveLength(8);
    expect(result.compatibility.components.every(item => item.maximum > 0)).toBe(true);
    expect(result.compatibility.additional).toHaveLength(4);
    expect(result.compatibility.direction).toMatchObject({ mode: "traditional-gendered", boyProfile: "A", girlProfile: "B" });
  }, 30_000);

  it("uses a caller-selected Varnada method and can omit optional traditional points", async () => {
    const result = await calculateVedicChart({ ...chennai, varnadaMethod: 3, includeTraditionalPoints: false }) as { traditionalPoints: unknown[]; traditionalConfig: { enabled: boolean; varnadaMethod: number; varnadaMethodName: string } };
    expect(result.traditionalPoints).toEqual([]);
    expect(result.traditionalConfig).toMatchObject({ enabled: false, varnadaMethod: 3, varnadaMethodName: "Sanjay Rath" });
  }, 30_000);
});
