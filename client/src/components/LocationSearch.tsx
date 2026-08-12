import { useEffect, useState } from "react";
import { CheckCircle2, LoaderCircle, MapPin, Search, TriangleAlert } from "lucide-react";
import { trpc } from "@/lib/trpc";

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

export function LocationSearch({ value, date, time, calendar, onChange, onResolved }: Props) {
  const [debounced, setDebounced] = useState(value);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), 280);
    return () => window.clearTimeout(timer);
  }, [value]);

  const suggestions = trpc.location.search.useQuery(
    { query: debounced.trim() || "___" },
    { enabled: open && debounced.trim().length >= 3 && !selectedPlaceId, staleTime: 60_000 }
  );
  const resolve = trpc.location.resolve.useMutation({
    onSuccess: resolved => {
      onChange(resolved.placeName);
      onResolved(resolved);
      setOpen(false);
    },
  });

  useEffect(() => {
    if (!selectedPlaceId) return;
    const timer = window.setTimeout(() => {
      resolve.mutate({ placeId: selectedPlaceId, queryLabel: selectedDescription ?? undefined, date, time, calendar });
    }, 250);
    return () => window.clearTimeout(timer);
    // selectedDescription does not affect the request; it is display-only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlaceId, selectedDescription, date, time, calendar]);

  function choose(placeId: string, description: string) {
    setSelectedPlaceId(placeId);
    setSelectedDescription(description);
    onChange(description);
  }

  return (
    <div className="location-search">
      <label><span>出生地点 / 事件地点</span><div className="location-input-wrap"><Search size={14} /><input value={value} onFocus={() => setOpen(true)} onChange={event => { setSelectedPlaceId(null); setSelectedDescription(null); onChange(event.target.value); setOpen(true); }} placeholder="输入城市，例如 Chennai 或 New York" required /></div></label>
      {open && !selectedPlaceId && suggestions.data && suggestions.data.length > 0 && <div className="city-suggestions">{suggestions.data.map(suggestion => <button type="button" key={suggestion.placeId} onMouseDown={event => event.preventDefault()} onClick={() => choose(suggestion.placeId, suggestion.description)}><MapPin size={14} /><span>{suggestion.description}</span></button>)}</div>}
      {open && suggestions.isFetching && <p className="location-status"><LoaderCircle size={12} className="spin" /> 正在检索城市…</p>}
      {selectedDescription && !resolve.isPending && <p className="location-status success"><CheckCircle2 size={12} /> 已选择 {selectedDescription}</p>}
      {resolve.isPending && <p className="location-status"><LoaderCircle size={12} className="spin" /> 正在解析历史时区与夏令时…</p>}
      {resolve.error && <p className="location-status error"><TriangleAlert size={12} /> {resolve.error.message}</p>}
    </div>
  );
}
