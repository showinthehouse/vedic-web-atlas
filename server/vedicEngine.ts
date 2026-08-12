import { spawn } from "node:child_process";

export type VedicInput = {
  date: string;
  time: string;
  placeName: string;
  latitude: number;
  longitude: number;
  timezone: number;
  calendar: "GREGORIAN" | "JULIAN";
  ayanamsa: "LAHIRI" | "RAMAN" | "KP" | "TRUE_PUSHYA";
  divisionalFactor: number;
};

export async function calculateVedicChart(input: VedicInput) {
  const scriptPath = new URL("../scripts/vedic_engine.py", import.meta.url).pathname;
  const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn("python3", [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 25_000);
    child.stdout.on("data", chunk => { stdout += chunk.toString(); });
    child.stderr.on("data", chunk => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", code => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(stderr.slice(-600) || `Vedic engine exited with code ${code}`));
      resolve({ stdout, stderr });
    });
    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });

  let data: unknown;
  try {
    data = JSON.parse(stdout);
  } catch {
    throw new Error(`Vedic engine returned malformed data. ${stderr.slice(-300)}`);
  }
  if (typeof data === "object" && data && "error" in data) {
    throw new Error(String((data as { error: unknown }).error));
  }
  return data;
}
