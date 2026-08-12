import { describe, expect, it } from "vitest";
import { calculateVedicChart, type VedicInput } from "./vedicEngine";

type GoldenExpectation = {
  ascendant: { sign: string; formattedDegree: string };
  moon: { sign: string; formattedDegree: string };
  nakshatra: { name: string; pada: number };
  dasaLord: string;
  sarvaTotal: number;
};

const samples: Array<{ name: string; input: VedicInput; expected: GoldenExpectation }> = [
  {
    name: "Chennai / Gregorian / D9",
    input: { date: "1996-12-07", time: "10:34", calendar: "GREGORIAN", placeName: "Chennai, India", latitude: 13.0878, longitude: 80.2785, timezone: 5.5, ayanamsa: "LAHIRI", divisionalFactor: 9 },
    expected: { ascendant: { sign: "Capricorn", formattedDegree: "22°26′45″" }, moon: { sign: "Libra", formattedDegree: "6°57′34″" }, nakshatra: { name: "Swati", pada: 1 }, dasaLord: "Rahu", sarvaTotal: 337 },
  },
  {
    name: "New York / Gregorian / western timezone",
    input: { date: "2000-01-01", time: "12:00", calendar: "GREGORIAN", placeName: "New York, USA", latitude: 40.7128, longitude: -74.006, timezone: -5, ayanamsa: "LAHIRI", divisionalFactor: 1 },
    expected: { ascendant: { sign: "Pisces", formattedDegree: "26°06′27″" }, moon: { sign: "Libra", formattedDegree: "21°58′19″" }, nakshatra: { name: "Vishakha", pada: 1 }, dasaLord: "Jupiter", sarvaTotal: 337 },
  },
  {
    name: "London / Julian calendar / historical date",
    input: { date: "1582-10-04", time: "12:00", calendar: "JULIAN", placeName: "London, UK", latitude: 51.5072, longitude: -0.1276, timezone: 0, ayanamsa: "LAHIRI", divisionalFactor: 1 },
    expected: { ascendant: { sign: "Sagittarius", formattedDegree: "2°41′39″" }, moon: { sign: "Taurus", formattedDegree: "9°56′55″" }, nakshatra: { name: "Krittika", pada: 4 }, dasaLord: "Sun", sarvaTotal: 337 },
  },
];

describe("vedic golden regression samples", () => {
  for (const sample of samples) {
    it(`matches the fixed reference output for ${sample.name}`, async () => {
      const result = await calculateVedicChart(sample.input) as {
        rasi: { body: string; sign: string; formattedDegree: string }[];
        panchanga: { nakshatra: { name: string; pada: number } };
        vimsottari: { lord: string }[];
        sarvashtakavarga: { points: number }[];
      };
      expect(result.rasi.find(item => item.body === "Ascendant")).toMatchObject(sample.expected.ascendant);
      expect(result.rasi.find(item => item.body === "Moon")).toMatchObject(sample.expected.moon);
      expect(result.panchanga.nakshatra).toMatchObject(sample.expected.nakshatra);
      expect(result.vimsottari[0]?.lord).toBe(sample.expected.dasaLord);
      expect(result.sarvashtakavarga.reduce((sum, item) => sum + item.points, 0)).toBe(sample.expected.sarvaTotal);
    }, 30_000);
  }
});
