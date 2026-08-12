import { spawn } from "node:child_process";
import { makeRequest, type GeocodingResult } from "./_core/map";

type CalendarType = "GREGORIAN" | "JULIAN";

type TimezoneInput = {
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  calendar: CalendarType;
};

type TimezoneResolution = {
  timeZoneId: string;
  offsetHours: number;
  formattedOffset: string;
  dstApplied: boolean;
  resolvedGregorianDate: string;
  warning: string | null;
};

async function runTimezoneResolver(input: TimezoneInput): Promise<TimezoneResolution> {
  const scriptPath = new URL("../scripts/resolve_timezone.py", import.meta.url).pathname;
  return await new Promise<TimezoneResolution>((resolve, reject) => {
    const child = spawn("python3", [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 12_000);
    child.stdout.on("data", chunk => { stdout += chunk.toString(); });
    child.stderr.on("data", chunk => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", code => {
      clearTimeout(timer);
      try {
        const result = JSON.parse(stdout) as TimezoneResolution & { error?: string };
        if (result.error) return reject(new Error(result.error));
        if (code !== 0) return reject(new Error(stderr || `Timezone resolver exited with ${code}`));
        resolve(result);
      } catch {
        reject(new Error(stderr || "Timezone resolver returned malformed data."));
      }
    });
    child.stdin.write(JSON.stringify(input));
    child.stdin.end();
  });
}

type OfflineCity = { description: string; placeId: string; latitude: number; longitude: number };

async function runCityLookup(payload: { action: "search"; query: string } | { action: "resolve"; placeName: string }) {
  const scriptPath = new URL("../scripts/city_lookup.py", import.meta.url).pathname;
  return await new Promise<{ results?: OfflineCity[]; result?: OfflineCity | null }>((resolve, reject) => {
    const child = spawn("python3", [scriptPath], { stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, PYTHONWARNINGS: "ignore::SyntaxWarning" } });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 10_000);
    child.stdout.on("data", chunk => { stdout += chunk.toString(); });
    child.stderr.on("data", chunk => { stderr += chunk.toString(); });
    child.on("error", error => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", code => {
      clearTimeout(timer);
      try {
        const data = JSON.parse(stdout) as { error?: string; results?: OfflineCity[]; result?: OfflineCity | null };
        if (code !== 0 || data.error) return reject(new Error(data.error || stderr || "Offline city lookup failed."));
        resolve(data);
      } catch {
        reject(new Error(stderr || "Offline city lookup returned malformed data."));
      }
    });
    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

type AutocompleteResponse = { predictions: Array<{ description: string; place_id: string; types: string[] }> };

export async function searchCities(query: string) {
  try {
    const response = await makeRequest<AutocompleteResponse>("/maps/api/place/autocomplete/json", { input: query, types: "(cities)" });
    return response.predictions.slice(0, 6).map(prediction => ({ description: prediction.description, placeId: prediction.place_id, types: prediction.types }));
  } catch (mapsError) {
    try {
      const offline = await runCityLookup({ action: "search", query });
      return (offline.results ?? []).map(item => ({ description: item.description, placeId: item.placeId, types: ["locality", "offline"] }));
    } catch (offlineError) {
      console.warn("[Location] City autocomplete unavailable; returning no suggestions.", { mapsError, offlineError });
      return [];
    }
  }
}

export async function resolveCity(input: { placeId: string; queryLabel?: string; date: string; time: string; calendar: CalendarType }) {
  let offline: { result?: OfflineCity | null } | null = null;
  if (input.placeId.startsWith("pyjhora:")) {
    try {
      offline = await runCityLookup({ action: "resolve", placeName: input.placeId.slice("pyjhora:".length) });
    } catch (error) {
      console.warn("[Location] Offline city resolution unavailable.", error);
    }
  }
  let response: GeocodingResult | null = null;
  if (!offline) {
    try {
      response = await makeRequest<GeocodingResult>("/maps/api/geocode/json", { place_id: input.placeId });
    } catch (mapsError) {
      try {
        const fallback = await runCityLookup({ action: "search", query: input.queryLabel || "" });
        offline = { result: fallback.results?.[0] ?? null };
      } catch (offlineError) {
        console.warn("[Location] City resolution unavailable after map lookup failed.", { mapsError, offlineError });
      }
    }
  }
  const result = response?.results[0];
  const latitude = offline?.result?.latitude ?? result?.geometry.location.lat;
  const longitude = offline?.result?.longitude ?? result?.geometry.location.lng;
  const placeName = offline?.result?.description ?? result?.formatted_address;
  if (latitude === undefined || longitude === undefined || !placeName) throw new Error("未找到该城市的坐标，请选择另一条搜索建议或手动输入坐标。");
  const timezone = await runTimezoneResolver({
    latitude,
    longitude,
    date: input.date,
    time: input.time,
    calendar: input.calendar,
  });
  return {
    placeName,
    latitude,
    longitude,
    ...timezone,
  };
}
