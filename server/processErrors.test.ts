import { describe, expect, it } from "vitest";
import { isRetryablePdfFailure, PdfReportError, parsePdfReportResponse, pdfReportMessage } from "./pdfReport";
import { isRetryableVedicFailure, parseVedicEngineResponse, VedicEngineError, vedicEngineMessage } from "./vedicEngine";

function expectFailure(action: () => unknown, kind: string) {
  try {
    action();
    throw new Error("Expected action to throw");
  } catch (error) {
    expect(error).toHaveProperty("kind", kind);
  }
}

describe("external process safety messages", () => {
  it("uses user-safe Chinese messages for every Vedic engine failure class", () => {
    for (const kind of ["timeout", "output", "spawn", "exit", "protocol", "domain"] as const) {
      const error = new VedicEngineError(kind, vedicEngineMessage(kind));
      expect(error.message).toMatch(/重试|核对|异常|不可用|无效/);
      expect(error.message).not.toMatch(/python3|Traceback|\/home\//i);
    }
  });

  it("uses user-safe Chinese messages for every PDF generator failure class", () => {
    for (const kind of ["timeout", "output", "spawn", "exit", "protocol"] as const) {
      const error = new PdfReportError(kind, pdfReportMessage(kind));
      expect(error.message).toMatch(/重试|异常|不可用|无效/);
      expect(error.message).not.toMatch(/python3|Traceback|\/home\//i);
    }
  });

  it("rejects malformed and domain-rejected Vedic responses with safe protocol errors", () => {
    expectFailure(() => parseVedicEngineResponse("not-json", "Traceback hidden"), "protocol");
    expectFailure(() => parseVedicEngineResponse(JSON.stringify({ error: "bad local input" })), "domain");
  });

  it("rejects invalid PDF JSON and invalid PDF payloads with a safe protocol error", () => {
    expectFailure(() => parsePdfReportResponse("not-json", "Traceback hidden"), "protocol");
    expectFailure(() => parsePdfReportResponse(JSON.stringify({ filename: "report.pdf", base64: "not-a-pdf" })), "protocol");
    expect(parsePdfReportResponse(JSON.stringify({ filename: "report.pdf", base64: "JVBERi0xLjQ=" }))).toEqual({ filename: "report.pdf", base64: "JVBERi0xLjQ=" });
  });

  it("retries only transient start or exit failures, never input, timeout or protocol failures", () => {
    expect(isRetryableVedicFailure(new VedicEngineError("spawn", "x"))).toBe(true);
    expect(isRetryableVedicFailure(new VedicEngineError("exit", "x"))).toBe(true);
    expect(isRetryableVedicFailure(new VedicEngineError("timeout", "x"))).toBe(false);
    expect(isRetryableVedicFailure(new VedicEngineError("protocol", "x"))).toBe(false);
    expect(isRetryablePdfFailure(new PdfReportError("spawn", "x"))).toBe(true);
    expect(isRetryablePdfFailure(new PdfReportError("exit", "x"))).toBe(true);
    expect(isRetryablePdfFailure(new PdfReportError("timeout", "x"))).toBe(false);
  });
});
