import { useEffect, useState } from "react";
import { CheckCircle2, Database, History, LoaderCircle, MapPin, Search, TriangleAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { normalizeCalendarDate, normalizeClockTime } from "@/lib/dateInput";

type CalendarType = "GREGORIAN" | "JULIAN";

type ResolvedLocation = {
  placeName: string;
  latitude: number;
  longitude: number;
  timeZoneId: string;
  offsetHours: number;
  formattedOffset: string;
  dstApplied: boolean;
  warning: string | null;
};

type Props = {
  value: string;
  date: string;
  time: string;
  calendar: CalendarType;
  onChange: (value: string) => void;
  onResolved: (location: ResolvedLocation) => void;
};

type RecentCity = { placeId: string; description: string; source: string };
const RECENT_CITIES_KEY = "vedic-web-atlas:recent-china-cities";
const RECENT_CITY_LIMIT = 5;

function sourceFor(placeId: string, types?: string[]) {
  if (placeId.startsWith("china:")) return "中国本地城市索引";
  if (types?.includes("offline")) return "全球离线回退";
  return "地图服务";
}

function readRecentCities(): RecentCity[] {
  try {
    const raw = window.localStorage.getItem(RECENT_CITIES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.placeId === "string" && typeof item.description === "string" && typeof item.source === "string").slice(0, RECENT_CITY_LIMIT) : [];
  } catch {
    return [];
  }
}

export function LocationSearch({ value, date, time, calendar, onChange, onResolved }: Props) {
  const [debounced, setDebounced] = useState(value);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [recentCities, setRecentCities] = useState<RecentCity[]>([]);
  const [activeSource, setActiveSource] = useState<string | null>(null);

  useEffect(() => setRecentCities(readRecentCities()), []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), 280);
    return () => window.clearTimeout(timer);
  }, [value]);

  const suggestions = trpc.location.search.useQuery(
    { query: debounced.trim() || "___" },
    { enabled: open && (/[\u4e00-\u9fff]/.test(debounced.trim()) ? debounced.trim().length >= 2 : debounced.trim().length >= 3) && !selectedPlaceId, staleTime: 60_000 }
  );
  const resolve = trpc.location.resolve.useMutation({
    onSuccess: resolved => {
      setInputError(null);
      if (selectedPlaceId && selectedDescription && activeSource) {
        const recent: RecentCity = { placeId: selectedPlaceId, description: selectedDescription, source: activeSource };
        const next = [recent, ...recentCities.filter(item => item.placeId !== recent.placeId)].slice(0, RECENT_CITY_LIMIT);
        setRecentCities(next);
        window.localStorage.setItem(RECENT_CITIES_KEY, JSON.stringify(next));
      }
      onChange(resolved.placeName);
      onResolved(resolved);
      setOpen(false);
    },
  });

  useEffect(() => {
    if (!selectedPlaceId) return;
    const normalizedDate = normalizeCalendarDate(date);
    const normalizedTime = normalizeClockTime(time);
    if (!normalizedDate || !normalizedTime) {
      setInputError("请先完成出生日期（YYYY-MM-DD）和当地时间，再选择城市。 ");
      return;
    }
    setInputError(null);
    resolve.mutate({ placeId: selectedPlaceId, queryLabel: selectedDescription ?? undefined, date: normalizedDate, time: normalizedTime, calendar });
    // selectedDescription does not affect the request; it is display-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlaceId, selectedDescription, date, time, calendar]);

  function choose(placeId: string, description: string, source: string) {
    setInputError(null);
    setActiveSource(source);
    setSelectedPlaceId(placeId);
    setSelectedDescription(description);
    onChange(description);
  }

  return (
    <div className="location-search">
      <label><span>出生地点 / 事件地点</span><div className="location-input-wrap"><Search size={14} /><input value={value} onFocus={() => { setSelectedPlaceId(null); setOpen(true); }} onChange={event => { setSelectedPlaceId(null); setSelectedDescription(null); setActiveSource(null); onChange(event.target.value); setOpen(true); }} placeholder="输入中国城市，例如 北京、Shanghai 或 Chengdu" required /></div></label>
      {open && !selectedPlaceId && recentCities.length > 0 && <div className="recent-cities"><span><History size={12} /> 最近使用</span><div>{recentCities.map(city => <button type="button" key={city.placeId} onMouseDown={event => event.preventDefault()} onClick={() => choose(city.placeId, city.description, city.source)}>{city.description}</button>)}</div></div>}
      {open && !selectedPlaceId && suggestions.data && suggestions.data.length > 0 && <div className="city-suggestions">{suggestions.data.map(suggestion => <button type="button" key={suggestion.placeId} onMouseDown={event => event.preventDefault()} onClick={() => choose(suggestion.placeId, suggestion.description, sourceFor(suggestion.placeId, suggestion.types))}><MapPin size={14} /><span>{suggestion.description}</span><small>{sourceFor(suggestion.placeId, suggestion.types)}</small></button>)}</div>}
      {open && suggestions.isFetching && <p className="location-status"><LoaderCircle size={12} className="spin" /> 正在检索城市…</p>}
      {(activeSource || (suggestions.data?.length ? sourceFor(suggestions.data[0].placeId, suggestions.data[0].types) : null)) && <p className="location-source"><Database size={12} /> 数据源：{activeSource || sourceFor(suggestions.data![0].placeId, suggestions.data![0].types)}{resolve.isPending ? " · 正在解析历史时区" : " · 已就绪"}</p>}
      {selectedDescription && !resolve.isPending && !inputError && <p className="location-status success"><CheckCircle2 size={12} /> 已选择 {selectedDescription}</p>}
      {resolve.isPending && <p className="location-status"><LoaderCircle size={12} className="spin" /> 正在解析历史时区与夏令时…</p>}
      {(inputError || resolve.error) && <p className="location-status error"><TriangleAlert size={12} /> {inputError || resolve.error?.message}</p>}
    </div>
  );
}
