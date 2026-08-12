import { describe, expect, it } from "vitest";
import { createPdfReport } from "./pdfReport";
import { calculateVedicChart, type VedicInput } from "./vedicEngine";

const chennai: VedicInput = {
  date: "1996-12-07", time: "10:34", placeName: "Chennai, India", latitude: 13.0878,
  longitude: 80.2785, timezone: 5.5, calendar: "GREGORIAN", ayanamsa: "LAHIRI", divisionalFactor: 1,
};

describe("PDF report", () => {
  it("generates a non-empty structured PDF with a Chinese-safe report title", async () => {
    const result = await calculateVedicChart(chennai);
    const file = await createPdfReport({ result });
    const bytes = Buffer.from(file.base64, "base64");

    expect(file.filename).toBe("vedic-web-atlas-report.pdf");
    expect(bytes.subarray(0, 4).toString("ascii")).toBe("%PDF");
    expect(bytes.byteLength).toBeGreaterThan(20_000);
    expect(bytes.toString("latin1")).toContain("STSong-Light");
  }, 30_000);
});
