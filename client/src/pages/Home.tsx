import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Compass,
  Copy,
  FileCode2,
  Globe2,
  LoaderCircle,
  MapPin,
  Orbit,
  RotateCcw,
  Sparkles,
  Sun,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { AshtakavargaPanel } from "@/components/AshtakavargaPanel";

type ChartItem = {
  body: string;
  key: string;
  signIndex: number;
  sign: string;
  degree: number;
  formattedDegree: string;
};

type CalculationResult = {
  engine: { name: string; license: string; ayanamsa: string };
  input: { date: string; time: string; calendar: string; placeName: string; latitude: number; longitude: number; timezone: number };
  selectedChart: { factor: number; label: string; items: ChartItem[] };
  rasi: ChartItem[];
  navamsa: ChartItem[];
  panchanga: { weekday: string; tithi: { number: number; paksha: string; endTime: string }; nakshatra: { number: number; name: string; pada: number; endTime: string }; sunrise: string; sunset: string };
  vimsottari: { lord: string; start: string; end: string; years: number }[];
  shadbala: { planet: string; virupas: number; rupas: number; isStrong: boolean }[];
  sarvashtakavarga: { sign: string; signIndex: number; points: number }[];
  transits: ChartItem[];
};

const signShort = ["Ar", "Ta", "Ge", "Ca", "Le", "Vi", "Li", "Sc", "Sg", "Cp", "Aq", "Pi"];
const divisionalChoices = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];

function NorthIndianChart({ items, label }: { items: ChartItem[]; label: string }) {
  const signBodies = useMemo(() => {
    const map = new Map<number, ChartItem[]>();
    items.forEach(item => map.set(item.signIndex, [...(map.get(item.signIndex) ?? []), item]));
    return map;
  }, [items]);
  const positions = [
    [180, 36], [272, 65], [324, 126], [315, 225], [268, 297], [180, 325],
    [92, 297], [45, 225], [36, 126], [90, 65], [132, 116], [228, 116],
  ];
  return (
    <div className="north-chart" aria-label={`${label} 北印度星盘`}>
      <svg viewBox="0 0 360 360" role="img">
        <rect x="18" y="18" width="324" height="324" className="chart-outline" />
        <path d="M18 18 L342 342 M342 18 L18 342 M180 18 L342 180 L180 342 L18 180 Z" className="chart-grid" />
        <path d="M18 180 L180 18 L342 180 L180 342 Z" className="chart-grid faint" />
        <circle cx="180" cy="180" r="28" className="chart-center" />
        <text x="180" y="177" textAnchor="middle" className="chart-center-label">{label}</text>
        <text x="180" y="193" textAnchor="middle" className="chart-center-sub">SIDEREAL</text>
        {positions.map(([x, y], index) => {
          const contents = signBodies.get(index) ?? [];
          return (
            <g key={index}>
              <text x={x} y={y - 11} textAnchor="middle" className="chart-sign">{signShort[index]}</text>
              <text x={x} y={y + 4} textAnchor="middle" className="chart-planet">{contents.map(item => item.body === "Ascendant" ? "As" : item.body.slice(0, 2)).join(" · ")}</text>
              <text x={x} y={y + 18} textAnchor="middle" className="chart-degree">{contents.filter(item => item.body === "Ascendant").map(item => item.formattedDegree).join("")}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ResultTable({ items }: { items: ChartItem[] }) {
  return (
    <div className="position-table">
      <div className="position-head"><span>天体</span><span>星座</span><span>位置</span></div>
      {items.map(item => (
        <div className="position-row" key={item.key}>
          <span>{item.body}</span><span>{item.sign}</span><span>{item.formattedDegree}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [date, setDate] = useState("1996-12-07");
  const [time, setTime] = useState("10:34");
  const [placeName, setPlaceName] = useState("Chennai, India");
  const [latitude, setLatitude] = useState("13.0878");
  const [longitude, setLongitude] = useState("80.2785");
  const [timezone, setTimezone] = useState("5.5");
  const [calendar, setCalendar] = useState<"GREGORIAN" | "JULIAN">("GREGORIAN");
  const [ayanamsa, setAyanamsa] = useState<"LAHIRI" | "RAMAN" | "KP" | "TRUE_PUSHYA">("LAHIRI");
  const [divisionalFactor, setDivisionalFactor] = useState(1);
  const [activeTab, setActiveTab] = useState<"chart" | "panchanga" | "dasa" | "strength" | "ashtaka" | "transits">("chart");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const calculate = trpc.astrology.calculate.useMutation({
    onSuccess: data => {
      setResult(data as CalculationResult);
      setActiveTab("chart");
      setFormError(null);
    },
    onError: error => setFormError(error.message),
  });

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const lat = Number(latitude);
    const lon = Number(longitude);
    const tz = Number(timezone);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(tz)) {
      setFormError("请填写有效的经度、纬度和时区偏移量。");
      return;
    }
    calculate.mutate({ date, time, placeName, latitude: lat, longitude: lon, timezone: tz, calendar, ayanamsa, divisionalFactor });
  }

  function loadChennaiPreset() {
    setPlaceName("Chennai, India"); setLatitude("13.0878"); setLongitude("80.2785"); setTimezone("5.5");
  }

  const displayChart = result?.selectedChart.factor === 1 ? result.rasi : result?.selectedChart.items;
  const displayLabel = result ? (result.selectedChart.factor === 1 ? "RASI / D1" : result.selectedChart.label) : "RASI / D1";

  return (
    <div className="astro-app">
      <header className="app-header">
        <a className="app-brand" href="#top"><span className="brand-orbit"><Orbit size={19} /></span><span><b>Vedic</b> Web Atlas</span></a>
        <div className="engine-status"><span className="status-pulse" /> PYJHORA + SWISS EPHEMERIS <span className="status-divider" /> AGPL-3.0</div>
      </header>

      <main id="top" className="app-main">
        <aside className="input-sidebar">
          <div className="sidebar-heading"><span className="section-tag">INPUT / 01</span><h1>出生资料<br /><em>与计算参数</em></h1><p>所有结果均由服务端 PyJHora 与 Swiss Ephemeris 计算，而非演示数据。</p></div>
          <form onSubmit={submit} className="chart-form">
            <div className="field-grid two"><label><span>出生日期</span><input type="date" value={date} onChange={event => setDate(event.target.value)} required /></label><label><span>当地时间</span><input type="time" value={time} onChange={event => setTime(event.target.value)} required /></label></div>
            <label><span>出生地点 / 事件地点</span><input value={placeName} onChange={event => setPlaceName(event.target.value)} placeholder="例如 Chennai, India" required /></label>
            <button type="button" onClick={loadChennaiPreset} className="preset-button"><MapPin size={13} /> 使用 Chennai 校验样例</button>
            <div className="field-grid three"><label><span>纬度</span><input inputMode="decimal" value={latitude} onChange={event => setLatitude(event.target.value)} /></label><label><span>经度</span><input inputMode="decimal" value={longitude} onChange={event => setLongitude(event.target.value)} /></label><label><span>UTC</span><input inputMode="decimal" value={timezone} onChange={event => setTimezone(event.target.value)} /></label></div>
            <div className="field-grid three"><label><span>历法</span><select value={calendar} onChange={event => setCalendar(event.target.value as typeof calendar)}><option value="GREGORIAN">Gregorian</option><option value="JULIAN">Julian</option></select></label><label><span>Ayanamsa</span><select value={ayanamsa} onChange={event => setAyanamsa(event.target.value as typeof ayanamsa)}><option value="LAHIRI">Lahiri</option><option value="RAMAN">Raman</option><option value="KP">KP</option><option value="TRUE_PUSHYA">True Pushya</option></select></label><label><span>目标分盘</span><select value={divisionalFactor} onChange={event => setDivisionalFactor(Number(event.target.value))}>{divisionalChoices.map(factor => <option value={factor} key={factor}>D-{factor}{factor === 1 ? " · Rasi" : factor === 9 ? " · Navamsa" : ""}</option>)}</select></label></div>
            <button type="submit" className="calculate-button" disabled={calculate.isPending}>{calculate.isPending ? <><LoaderCircle size={17} className="spin" /> 正在计算星历…</> : <><Sparkles size={17} /> 生成真实印度占星报告</>}</button>
            {formError && <div className="form-error"><CircleAlert size={15} />{formError}</div>}
          </form>
          <div className="license-panel"><FileCode2 size={16} /><div><b>AGPL 开源引擎</b><p>包含 <a href="https://github.com/naturalstupid/PyJHora" target="_blank" rel="noreferrer">PyJHora</a> 与 <a href="https://www.astro.com/swisseph/" target="_blank" rel="noreferrer">Swiss Ephemeris</a>；请同时阅读 <a href="https://www.astro.com/swisseph/swephinfo_e.htm" target="_blank" rel="noreferrer">官方许可条款</a>。公开部署时应提供相应源码与许可证说明。</p></div></div>
        </aside>

        <section className="results-canvas">
          <div className="canvas-topline"><div><span className="section-tag">CALCULATION / 02</span><h2>{result ? "你的计算结果" : "准备开始一次计算"}</h2></div>{result && <div className="result-context"><MapPin size={14} /><span>{result.input.placeName}</span><span>·</span><span>{result.input.latitude.toFixed(4)}, {result.input.longitude.toFixed(4)}</span></div>}</div>

          {!result && !calculate.isPending && <div className="empty-state"><div className="empty-orbit"><Orbit size={74} /></div><h3>输入出生资料，<br />打开第一张真实星盘。</h3><p>此应用使用真实的星历与吠陀占星规则计算 Rasi、Navamsa、Panchanga、Vimsottari Dasa 与实时过境。</p><div className="empty-points"><span><CheckCircle2 size={14} /> 真实星历</span><span><CheckCircle2 size={14} /> 可选分盘</span><span><CheckCircle2 size={14} /> 参数透明</span></div></div>}

          {calculate.isPending && <div className="loading-state"><LoaderCircle size={42} className="spin" /><p>正在让星历、地点与分盘规则对齐…</p></div>}

          {result && <>
            <div className="result-tabs" role="tablist"><button className={activeTab === "chart" ? "active" : ""} onClick={() => setActiveTab("chart")}><Orbit size={15} /> 星盘</button><button className={activeTab === "panchanga" ? "active" : ""} onClick={() => setActiveTab("panchanga")}><CalendarDays size={15} /> Panchanga</button><button className={activeTab === "dasa" ? "active" : ""} onClick={() => setActiveTab("dasa")}><Clock3 size={15} /> Vimsottari Dasa</button><button className={activeTab === "strength" ? "active" : ""} onClick={() => setActiveTab("strength")}><Compass size={15} /> Shadbala</button><button className={activeTab === "ashtaka" ? "active" : ""} onClick={() => setActiveTab("ashtaka")}><Copy size={15} /> Ashtakavarga</button><button className={activeTab === "transits" ? "active" : ""} onClick={() => setActiveTab("transits")}><Globe2 size={15} /> 过境</button></div>
            {activeTab === "chart" && <div className="chart-tab"><div className="chart-tab-head"><div><span className="section-tag">{displayLabel} / NORTH INDIAN</span><h3>{displayLabel === "RASI / D1" ? "本命盘 Rasi" : `目标分盘 ${displayLabel}`}</h3></div><div className="chart-key"><span className="key-dot asc" /> As = Ascendant <span className="key-dot planet" /> 其余为行星缩写</div></div><div className="chart-layout-real"><NorthIndianChart items={displayChart ?? []} label={displayLabel} /><div className="chart-data"><ResultTable items={displayChart ?? []} /></div></div><div className="secondary-chart"><div><span className="section-tag">NAVAMSA / D9</span><p>Navamsa 已同步计算；选择 D-9 作为目标分盘可在主图中展开详细位置。</p></div><div className="mini-rasi">{result.navamsa.slice(0, 5).map(item => <span key={item.key}><b>{item.body === "Ascendant" ? "As" : item.body.slice(0, 2)}</b> {item.sign}</span>)}</div></div></div>}
            {activeTab === "panchanga" && <div className="panchanga-grid"><div className="panchanga-hero"><Sun size={22} /><span className="section-tag">DAILY PANCHANGA</span><h3>{result.panchanga.weekday}</h3><p>以出生地点与时区计算的当天 Panchanga。</p></div><div className="panchanga-card"><span>Tithi</span><b>{result.panchanga.tithi.paksha} {result.panchanga.tithi.number}</b><small>结束 {result.panchanga.tithi.endTime}</small></div><div className="panchanga-card"><span>Nakshatra</span><b>{result.panchanga.nakshatra.name}</b><small>第 {result.panchanga.nakshatra.pada} pada · 结束 {result.panchanga.nakshatra.endTime}</small></div><div className="panchanga-card"><span>Sunrise</span><b>{result.panchanga.sunrise}</b><small>当地时间</small></div><div className="panchanga-card"><span>Sunset</span><b>{result.panchanga.sunset}</b><small>当地时间</small></div></div>}
            {activeTab === "dasa" && <div className="dasa-panel"><div className="dasa-intro"><span className="section-tag">VIMSHOTTARI / 120 YEARS</span><h3>Mahadasa 时间轴</h3><p>按出生时月亮宿与当前参数计算。周期起止日为当地时间近似展示。</p></div><div className="dasa-list">{result.vimsottari.map((period, index) => <div className="dasa-row" key={`${period.lord}-${period.start}`}><span className="dasa-index">{String(index + 1).padStart(2, "0")}</span><b>{period.lord}</b><span>{period.start}</span><span>{period.end}</span><span className="dasa-years">{period.years} 年</span></div>)}</div></div>}
            {activeTab === "strength" && <div className="strength-panel"><div className="dasa-intro"><span className="section-tag">SHADBALA / SIXFOLD STRENGTH</span><h3>行星六力</h3><p>按 PyJHora 的 Shadbala 模块计算。Rupa 是 Virupa ÷ 60；“达标”表示高于该行星最低所需强度。</p></div><div className="strength-list">{result.shadbala.map(score => <div className="strength-row" key={score.planet}><b>{score.planet}</b><div className="strength-track"><i style={{ width: `${Math.min(score.rupas / 10 * 100, 100)}%` }} /></div><span>{score.rupas.toFixed(2)} Rupa</span><span className={score.isStrong ? "strength-status good" : "strength-status"}>{score.isStrong ? "达标" : "较弱"}</span></div>)}</div></div>}
            {activeTab === "ashtaka" && <AshtakavargaPanel scores={result.sarvashtakavarga} />}
            {activeTab === "transits" && <div className="transit-panel"><div className="transit-intro"><Globe2 size={22} /><span className="section-tag">LIVE TRANSITS</span><h3>当前过境位置</h3><p>以输入地点的时区显示当前时间对应的恒星黄道位置；不与出生盘混合解释。</p></div><ResultTable items={result.transits.filter(item => item.body !== "Ascendant")} /></div>}
            <div className="engine-foot"><span><span className="status-pulse" /> 已计算</span><span>{result.engine.name}</span><span>{result.engine.ayanamsa}</span><span>{result.input.calendar}</span><span>输入：{result.input.date} {result.input.time}</span></div>
          </>}
        </section>
      </main>
      <footer className="app-footer"><span>Vedic Web Atlas</span><span>Calculation engine: PyJHora + Swiss Ephemeris</span><div><a href="https://github.com/naturalstupid/PyJHora" target="_blank" rel="noreferrer">PyJHora ↗</a><a href="https://www.astro.com/swisseph/swephinfo_e.htm" target="_blank" rel="noreferrer">Swiss Ephemeris License ↗</a></div></footer>
    </div>
  );
}
