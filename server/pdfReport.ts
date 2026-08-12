import { spawn } from "node:child_process";

export async function createPdfReport(payload: unknown) {
  const scriptPath = new URL("../scripts/pdf_report.py", import.meta.url).pathname;
  return new Promise<{ filename: string; base64: string }>((resolve, reject) => {
    const child = spawn("python3", [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = ""; let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 25_000);
    child.stdout.on("data", chunk => { stdout += chunk.toString(); }); child.stderr.on("data", chunk => { stderr += chunk.toString(); });
    child.on("close", code => { clearTimeout(timer); if (code !== 0) return reject(new Error(stderr.slice(-500) || "PDF 报告生成失败。")); try { resolve(JSON.parse(stdout)); } catch { reject(new Error("PDF 报告返回格式无效。")); } });
    child.stdin.end(JSON.stringify(payload));
  });
}
