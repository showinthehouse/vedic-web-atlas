import { spawn } from "node:child_process";
import { withProcessRetry } from "./processRetry";
import { getPythonExecutable } from "./pythonRuntime";

const PDF_TIMEOUT_MS = 25_000;
const PDF_MAX_OUTPUT_BYTES = 16 * 1024 * 1024;

export type PdfReportFailure = "timeout" | "output" | "spawn" | "exit" | "protocol";

export class PdfReportError extends Error {
  constructor(public readonly kind: PdfReportFailure, message: string) {
    super(message);
    this.name = "PdfReportError";
  }
}

export function pdfReportMessage(kind: PdfReportFailure) {
  return {
    timeout: "PDF 报告生成超时，请稍后重试或减少导出章节。",
    output: "PDF 报告数据量异常，已安全中止本次导出，请减少章节后重试。",
    spawn: "PDF 报告服务暂时不可用，请稍后重试。",
    exit: "PDF 报告生成失败，请稍后重试。",
    protocol: "PDF 报告返回格式无效，请稍后重试。",
  }[kind];
}

export function parsePdfReportResponse(stdout: string, stderr = "") {
  try {
    const file = JSON.parse(stdout) as { filename?: unknown; base64?: unknown };
    if (typeof file.filename !== "string" || typeof file.base64 !== "string" || !file.base64.startsWith("JVBER")) throw new Error("invalid PDF payload");
    return { filename: file.filename, base64: file.base64 };
  } catch (error) {
    console.error("[PDF report] malformed JSON", { error, stderr: stderr.slice(-1200), sample: stdout.slice(0, 300) });
    throw new PdfReportError("protocol", pdfReportMessage("protocol"));
  }
}

export function isRetryablePdfFailure(error: unknown): error is PdfReportError {
  return error instanceof PdfReportError && (error.kind === "spawn" || error.kind === "exit");
}

async function createPdfReportOnce(payload: unknown) {
  const scriptPath = new URL("../scripts/pdf_report.py", import.meta.url).pathname;
  return new Promise<{ filename: string; base64: string }>((resolve, reject) => {
    const child = spawn(getPythonExecutable(), [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;
    let oversized = false;
    const finish = (callback: () => void) => { if (settled) return; settled = true; clearTimeout(timer); callback(); };
    const stop = () => { if (!child.killed) child.kill("SIGKILL"); };
    const timer = setTimeout(() => { timedOut = true; stop(); }, PDF_TIMEOUT_MS);

    child.stdout.on("data", chunk => {
      if (oversized) return;
      stdout += chunk.toString();
      if (Buffer.byteLength(stdout, "utf8") > PDF_MAX_OUTPUT_BYTES) { oversized = true; stop(); }
    });
    child.stderr.on("data", chunk => { if (Buffer.byteLength(stderr, "utf8") < 32_768) stderr += chunk.toString(); });
    child.on("error", error => finish(() => { console.error("[PDF report] process start failure", error); reject(new PdfReportError("spawn", pdfReportMessage("spawn"))); }));
    child.on("close", code => finish(() => {
      if (timedOut) return reject(new PdfReportError("timeout", pdfReportMessage("timeout")));
      if (oversized) return reject(new PdfReportError("output", pdfReportMessage("output")));
      if (code !== 0) { console.error("[PDF report] exited", { code, stderr: stderr.slice(-1200) }); return reject(new PdfReportError("exit", pdfReportMessage("exit"))); }
      try { resolve(parsePdfReportResponse(stdout, stderr)); }
      catch (error) { reject(error); }
    }));
    try {
      child.stdin.end(JSON.stringify(payload));
    } catch (error) {
      stop();
      finish(() => { console.error("[PDF report] input write failure", error); reject(new PdfReportError("spawn", pdfReportMessage("spawn"))); });
    }
  });
}

export async function createPdfReport(payload: unknown) {
  return withProcessRetry(
    () => createPdfReportOnce(payload),
    isRetryablePdfFailure,
    { onRetry: error => console.warn("[PDF report] transient process failure; retrying once", { kind: error.kind }) },
  );
}
