import { spawn } from "node:child_process";
import { withProcessRetry } from "./processRetry";
import { getPythonExecutable } from "./pythonRuntime";

export type VedicInput = {
  date: string;
  time: string;
  gender?: "FEMALE" | "MALE" | "UNSPECIFIED";
  placeName: string;
  latitude: number;
  longitude: number;
  timezone: number;
  calendar: "GREGORIAN" | "JULIAN";
  ayanamsa: "LAHIRI" | "RAMAN" | "KP" | "TRUE_PUSHYA";
  divisionalFactor: number;
  varnadaMethod?: number;
  includeTraditionalPoints?: boolean;
};

const ENGINE_TIMEOUT_MS = 25_000;
const ENGINE_MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

export type VedicEngineFailure = "timeout" | "output" | "spawn" | "exit" | "protocol" | "domain";

export class VedicEngineError extends Error {
  constructor(public readonly kind: VedicEngineFailure, message: string) {
    super(message);
    this.name = "VedicEngineError";
  }
}

export function vedicEngineMessage(kind: VedicEngineFailure) {
  return {
    timeout: "星历计算超过允许时间，请检查出生资料后重试。",
    output: "星历计算返回的数据量异常，已安全中止本次请求，请重试。",
    spawn: "星历计算服务暂时不可用，请稍后重试。",
    exit: "星历计算未能完成，请稍后重试。",
    protocol: "星历计算返回格式无效，请稍后重试。",
    domain: "星历计算无法处理当前资料，请核对出生日期、时间、地点和时区。",
  }[kind];
}

export function parseVedicEngineResponse(stdout: string, stderr = "") {
  let data: unknown;
  try {
    data = JSON.parse(stdout);
  } catch (error) {
    console.error("[Vedic engine] malformed JSON", { error, stderr: stderr.slice(-1200), sample: stdout.slice(0, 300) });
    throw new VedicEngineError("protocol", vedicEngineMessage("protocol"));
  }
  if (typeof data === "object" && data && "error" in data) {
    console.warn("[Vedic engine] domain rejection", String((data as { error: unknown }).error).slice(0, 600));
    throw new VedicEngineError("domain", vedicEngineMessage("domain"));
  }
  return data;
}

export function isRetryableVedicFailure(error: unknown): error is VedicEngineError {
  return error instanceof VedicEngineError && (error.kind === "spawn" || error.kind === "exit");
}

async function runVedicEngineOnce(input: unknown) {
  const scriptPath = new URL("../scripts/vedic_engine.py", import.meta.url).pathname;
  const { stdout, stderr } = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(getPythonExecutable(), [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;
    let timedOut = false;
    let oversized = false;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback();
    };
    const stop = () => { if (!child.killed) child.kill("SIGKILL"); };
    const timer = setTimeout(() => {
      timedOut = true;
      stop();
    }, ENGINE_TIMEOUT_MS);

    child.stdout.on("data", chunk => {
      if (oversized) return;
      stdout += chunk.toString();
      if (Buffer.byteLength(stdout, "utf8") > ENGINE_MAX_OUTPUT_BYTES) {
        oversized = true;
        stop();
      }
    });
    child.stderr.on("data", chunk => {
      if (Buffer.byteLength(stderr, "utf8") < 32_768) stderr += chunk.toString();
    });
    child.on("error", error => finish(() => {
      console.error("[Vedic engine] process start failure", error);
      reject(new VedicEngineError("spawn", vedicEngineMessage("spawn")));
    }));
    child.on("close", code => finish(() => {
      if (timedOut) return reject(new VedicEngineError("timeout", vedicEngineMessage("timeout")));
      if (oversized) return reject(new VedicEngineError("output", vedicEngineMessage("output")));
      if (code !== 0) {
        console.error("[Vedic engine] exited", { code, stderr: stderr.slice(-1200) });
        return reject(new VedicEngineError("exit", vedicEngineMessage("exit")));
      }
      resolve({ stdout, stderr });
    }));
    try {
      child.stdin.end(JSON.stringify(input));
    } catch (error) {
      stop();
      finish(() => {
        console.error("[Vedic engine] input write failure", error);
        reject(new VedicEngineError("spawn", vedicEngineMessage("spawn")));
      });
    }
  });

  return parseVedicEngineResponse(stdout, stderr);
}

async function runVedicEngine(input: unknown) {
  return withProcessRetry(
    () => runVedicEngineOnce(input),
    isRetryableVedicFailure,
    { onRetry: error => console.warn("[Vedic engine] transient process failure; retrying once", { kind: error.kind }) },
  );
}

export async function calculateVedicChart(input: VedicInput) {
  return runVedicEngine(input);
}

export async function calculateVedicCompatibility(left: VedicInput, right: VedicInput) {
  return runVedicEngine({ mode: "compatibility", left, right });
}
