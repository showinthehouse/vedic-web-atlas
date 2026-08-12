import { Fragment, useMemo, useState } from "react";
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
  Download,
  Printer,
  RotateCcw,
  Sparkles,
  Sun,
  UserRound,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { normalizeCalendarDate, normalizeClockTime } from "@/lib/dateInput";
import { AshtakavargaPanel } from "@/components/AshtakavargaPanel";
import { LocationSearch } from "@/components/LocationSearch";
import { ProfileShelf, type ProfileChartInput } from "@/components/ProfileShelf";

type ChartItem = {
  body: string;
  key: string;
  signIndex: number;
  sign: string;
  degree: number;
  formattedDegree: string;
  house: number;
  nakshatra: { number: number; name: string; pada: number; lord: string };
};

type CalculationResult = {
  engine: { name: string; license: string; ayanamsa: string; ayanamsaValue: number; zodiac: string };
  input: { date: string; time: string; calendar: string; placeName: string; latitude: number; longitude: number; latitudeDms: string; longitudeDms: string; timezone: number };
  selectedChart: { factor: number; label: string; items: ChartItem[] };
  rasi: ChartItem[];
  navamsa: ChartItem[];
  panchanga: { weekday: string; tithi: { number: number; paksha: string; name: string; startTime: string; endTime: string; percentLeft: number }; nakshatra: { number: number; name: string; pada: number; lord: string; startTime: string; endTime: string; percentLeft: number }; yoga: { number: number; name: string; startTime: string; endTime: string; percentLeft: number }; karana: { number: number; name: string; startTime: string; endTime: string; percentLeft: number }; lunarMonth: { number: number; name: string; isAdhika: boolean; isNija: boolean }; sunrise: string; sunset: string; dayLength: string; nightLength: string };
  vimsottari: { lord: string; start: string; end: string; years: number }[];
  shadbala: { planet: string; virupas: number; rupas: number; isStrong: boolean }[];
  sarvashtakavarga: { sign: string; signIndex: number; points: number }[];
  transits: ChartItem[];
  yogas: { name: string; matched: boolean; rule: string }[];
  muhurta: { abhijit: string[]; rahuKalam: string[]; yamaganda: string[]; gulikai: string[]; durmuhurtam: string[] };
  fineDasa: { maha: string; bhukti: string; antara: string; antaras: { lord: string; start: string; end: string; current: boolean }[] };
  charaKarakas: { karaka: string; planet: string }[];
  specialLagnas: ChartItem[];
  solarUpagrahas: ChartItem[];
  divisions: { factor: number; label: string; items: ChartItem[] }[];
  bhinnaAshtakavarga: { body: string; points: number[]; total: number }[];
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

function ResultTable({ items, detailed = false }: { items: ChartItem[]; detailed?: boolean }) {
  return (
    <div className={`position-table${detailed ? " detailed" : ""}`}>
      <div className="position-head"><span>天体</span><span>星座</span>{detailed && <><span>宫位</span><span>位置</span><span>星宿</span><span>Pada</span><span>宿主</span></>} {!detailed && <span>位置</span>}</div>
      {items.map(item => (
        <div className="position-row" key={item.key}>
          <span>{item.body}</span><span>{item.sign}</span>{detailed && <><span>{item.house}</span><span>{item.formattedDegree}</span><span>{item.nakshatra?.name ?? "—"}</span><span>{item.nakshatra?.pada ?? "—"}</span><span>{item.nakshatra?.lord ?? "—"}</span></>} {!detailed && <span>{item.formattedDegree}</span>}
        </div>
      ))}
    </div>
  );
}

function ComparisonPanel({ left, right, labels, compatibility }: { left: CalculationResult; right: CalculationResult; labels: [string, string]; compatibility?: { score: number; maximum: number; method: string; components: { name: string; score: number }[] } }) {
  const selected = (result: CalculationResult, body: string) => result.rasi.find(item => item.body === body);
  const fields = ["Ascendant", "Sun", "Moon", "Jupiter", "Venus"].map(body => ({ body, left: selected(left, body), right: selected(right, body) }));
  const exportReport = () => {
    const lines = [`# Vedic Web Atlas 双档案研究报告`, ``, `## 档案 A：${labels[0]}`, `- 输入：${left.input.date} ${left.input.time}，${left.input.placeName}`, ``, `## 档案 B：${labels[1]}`, `- 输入：${right.input.date} ${right.input.time}，${right.input.placeName}`, ``, `## 行星对照`, ...fields.map(field => `- ${field.body}：A ${field.left?.sign ?? "—"} ${field.left?.formattedDegree ?? ""}；B ${field.right?.sign ?? "—"} ${field.right?.formattedDegree ?? ""}`)];
    if (compatibility) lines.push(``, `## Compatibility`, `- 方法：${compatibility.method}`, `- Ashta Koota：${compatibility.score.toFixed(1)} / ${compatibility.maximum}`, ...compatibility.components.map(component => `- ${component.name}：${component.score}`), `- 范围：当前仅提供北印度 Ashta Koota 八项分数；不等同于完整合盘、关系建议或未来预测。`);
    lines.push(``, `> 说明：本报告呈现真实星历计算结果与分项，不构成个人关系、医疗、法律或财务结论。`, ``);
    const text = lines.join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "vedic-web-atlas-comparison.md"; anchor.click(); URL.revokeObjectURL(url);
  };
  return <section className="comparison-panel"><div className="comparison-title"><span className="section-tag">PROFILE COMPARISON</span><h3>双档案对比</h3><p>并列显示两个独立输入的真实计算位置；不自动生成关系结论。</p><button className="report-download" onClick={exportReport}><Download size={13} /> 下载研究报告 (.md)</button></div><div className="comparison-grid"><div className="comparison-name">A / {labels[0]}</div><div className="comparison-name">B / {labels[1]}</div>{fields.map(field => <Fragment key={field.body}><div className="comparison-cell"><b>{field.body}</b><span>{field.left?.sign} {field.left?.formattedDegree}</span></div><div className="comparison-cell"><b>{field.body}</b><span>{field.right?.sign} {field.right?.formattedDegree}</span></div></Fragment>)}</div>{compatibility && <div className="compatibility-score"><div><span>ASHTA KOOTA</span><b>{compatibility.score.toFixed(1)} <small>/ {compatibility.maximum}</small></b></div><p>{compatibility.method}</p><div className="koota-list">{compatibility.components.map(component => <span key={component.name}>{component.name} <b>{component.score}</b></span>)}</div><small className="compatibility-scope">范围：当前仅提供北印度 Ashta Koota 八项分数；不等同于完整合盘、关系建议或未来预测。</small></div>}</section>;
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
  const [activeTab, setActiveTab] = useState<"chart" | "details" | "panchanga" | "dasa" | "fineDasa" | "yogas" | "muhurta" | "strength" | "ashtaka" | "transits">("chart");
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [timezoneMeta, setTimezoneMeta] = useState<{ timeZoneId: string; formattedOffset: string; dstApplied: boolean; warning: string | null } | null>(null);
  const [profilesOpen, setProfilesOpen] = useState(false);
  const [comparison, setComparison] = useState<{ left: CalculationResult; right: CalculationResult; labels: [string, string]; compatibility?: { score: number; maximum: number; method: string; components: { name: string; score: number }[] } } | null>(null);

  const calculate = trpc.astrology.calculate.useMutation({
    onSuccess: data => {
      setResult(data as CalculationResult);
      setActiveTab("chart");
      setFormError(null);
    },
    onError: error => setFormError(error.message),
  });
  const compare = trpc.astrology.compare.useMutation();
  const pdfReport = trpc.reports.pdf.useMutation();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const lat = Number(latitude);
    const lon = Number(longitude);
    const tz = Number(timezone);
    const normalizedDate = normalizeCalendarDate(date);
    const normalizedTime = normalizeClockTime(time);
    if (!normalizedDate || !normalizedTime) {
      setFormError("请填写有效的出生日期（YYYY-MM-DD）和当地时间。");
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(tz)) {
      setFormError("请填写有效的经度、纬度和时区偏移量。");
      return;
    }
    calculate.mutate({ date: normalizedDate, time: normalizedTime, placeName, latitude: lat, longitude: lon, timezone: tz, calendar, ayanamsa, divisionalFactor });
  }

  function loadChennaiPreset() {
    setPlaceName("Chennai, India"); setLatitude("13.0878"); setLongitude("80.2785"); setTimezone("5.5");
  }

  function downloadPdf() {
    if (!result) return;
    pdfReport.mutate({ result, comparison: comparison ? { compatibility: comparison.compatibility } : undefined }, { onSuccess: file => { const link = document.createElement("a"); link.href = `data:application/pdf;base64,${file.base64}`; link.download = file.filename; link.click(); } });
  }

  const currentProfile: ProfileChartInput = { date, time, calendar, placeName, latitude: Number(latitude), longitude: Number(longitude), timezone: Number(timezone), timeZoneId: timezoneMeta?.timeZoneId, ayanamsa, divisionalFactor };
  function loadProfile(profile: ProfileChartInput) {
    setDate(profile.date); setTime(profile.time); setCalendar(profile.calendar); setPlaceName(profile.placeName); setLatitude(String(profile.latitude)); setLongitude(String(profile.longitude)); setTimezone(String(profile.timezone)); setAyanamsa(profile.ayanamsa); setDivisionalFactor(profile.divisionalFactor); setTimezoneMeta(profile.timeZoneId ? { timeZoneId: profile.timeZoneId, formattedOffset: `UTC${profile.timezone >= 0 ? "+" : ""}${profile.timezone}`, dstApplied: false, warning: null } : null);
  }

  const displayChart = result?.selectedChart.factor === 1 ? result.rasi : result?.selectedChart.items;
  const displayLabel = result ? (result.selectedChart.factor === 1 ? "RASI / D1" : result.selectedChart.label) : "RASI / D1";

  return (
    <div className="astro-app">
      <header className="app-header">
        <a className="app-brand" href="#top"><span className="brand-orbit"><Orbit size={19} /></span><span><b>Vedic</b> Web Atlas</span></a>
        <div className="header-actions"><div className="engine-status"><span className="status-pulse" /> PYJHORA + SWISS EPHEMERIS <span className="status-divider" /> AGPL-3.0</div><button className="profiles-trigger" onClick={() => setProfilesOpen(true)}><UserRound size={15} /> 档案</button></div>
      </header>

      <main id="top" className="app-main">
        <aside className="input-sidebar">
          <div className="sidebar-heading"><span className="section-tag">INPUT / 01</span><h1>出生资料<br /><em>与计算参数</em></h1><p>所有结果均由服务端 PyJHora 与 Swiss Ephemeris 计算，而非演示数据。</p></div>
          <form onSubmit={submit} className="chart-form">
            <div className="field-grid two"><label><span>出生日期</span><input type="date" value={date} onChange={event => setDate(event.target.value)} required /></label><label><span>当地时间</span><input type="time" value={time} onChange={event => setTime(event.target.value)} required /></label></div>
            <LocationSearch value={placeName} date={date} time={time} calendar={calendar} onChange={setPlaceName} onResolved={location => { setLatitude(location.latitude.toFixed(4)); setLongitude(location.longitude.toFixed(4)); setTimezone(String(location.offsetHours)); setTimezoneMeta(location); }} />
            <button type="button" onClick={loadChennaiPreset} className="preset-button"><MapPin size={13} /> 使用 Chennai 校验样例</button>
            <div className="field-grid three"><label><span>纬度</span><input inputMode="decimal" value={latitude} onChange={event => setLatitude(event.target.value)} /></label><label><span>经度</span><input inputMode="decimal" value={longitude} onChange={event => setLongitude(event.target.value)} /></label><label><span>UTC</span><input inputMode="decimal" value={timezone} onChange={event => setTimezone(event.target.value)} /></label></div>
            {timezoneMeta && <div className="timezone-meta"><span><MapPin size={12} /> {timezoneMeta.timeZoneId}</span><span>{timezoneMeta.formattedOffset}{timezoneMeta.dstApplied ? " · DST" : " · 标准时"}</span>{timezoneMeta.warning && <small>{timezoneMeta.warning}</small>}</div>}
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
            <div className="result-tabs" role="tablist"><button className={activeTab === "chart" ? "active" : ""} onClick={() => setActiveTab("chart")}><Orbit size={15} /> 星盘</button><button className={activeTab === "details" ? "active" : ""} onClick={() => setActiveTab("details")}><FileCode2 size={15} /> 详参</button><button className={activeTab === "panchanga" ? "active" : ""} onClick={() => setActiveTab("panchanga")}><CalendarDays size={15} /> Panchanga</button><button className={activeTab === "dasa" ? "active" : ""} onClick={() => setActiveTab("dasa")}><Clock3 size={15} /> Mahadasa</button><button className={activeTab === "fineDasa" ? "active" : ""} onClick={() => setActiveTab("fineDasa")}><Clock3 size={15} /> Antardasa</button><button className={activeTab === "yogas" ? "active" : ""} onClick={() => setActiveTab("yogas")}><Sparkles size={15} /> Yoga</button><button className={activeTab === "muhurta" ? "active" : ""} onClick={() => setActiveTab("muhurta")}><Sun size={15} /> Muhurta</button><button className={activeTab === "strength" ? "active" : ""} onClick={() => setActiveTab("strength")}><Compass size={15} /> Shadbala</button><button className={activeTab === "ashtaka" ? "active" : ""} onClick={() => setActiveTab("ashtaka")}><Copy size={15} /> Ashtakavarga</button><button className={activeTab === "transits" ? "active" : ""} onClick={() => setActiveTab("transits")}><Globe2 size={15} /> 过境</button></div>
            {activeTab === "chart" && <div className="chart-tab"><div className="chart-tab-head"><div><span className="section-tag">{displayLabel} / NORTH INDIAN</span><h3>{displayLabel === "RASI / D1" ? "本命盘 Rasi" : `目标分盘 ${displayLabel}`}</h3></div><div className="chart-key"><span className="key-dot asc" /> As = Ascendant <span className="key-dot planet" /> 其余为行星缩写</div></div><div className="chart-layout-real"><NorthIndianChart items={displayChart ?? []} label={displayLabel} /><div className="chart-data"><ResultTable items={displayChart ?? []} /></div></div><div className="secondary-chart"><div><span className="section-tag">NAVAMSA / D9</span><p>Navamsa 已同步计算；选择 D-9 作为目标分盘可在主图中展开详细位置。</p></div><div className="mini-rasi">{result.navamsa.slice(0, 5).map(item => <span key={item.key}><b>{item.body === "Ascendant" ? "As" : item.body.slice(0, 2)}</b> {item.sign}</span>)}</div></div></div>}
            {activeTab === "details" && (
              <div className="details-panel">
                <div className="dasa-intro">
                  <span className="section-tag">DENSE NATAL PARAMETERS</span>
                  <h3>基础参数、Karaka 与派生点</h3>
                  <p>参照专业报告的信息层级展示；所有数值由当前 PyJHora + Swiss Ephemeris 计算，不用示例或推断数据填充。</p>
                </div>
                <aside className="scope-note" role="note" aria-label="参数覆盖与当前边界">
                  <b>参数覆盖与当前边界</b>
                  <p><strong>已支持：</strong>Rasi、五支历、Jaimini Karaka、特殊 Lagna、太阳虚点、Sarva/Bhinna Ashtakavarga、D1–D60、Dasa、Yoga、Muhurta、Shadbala。</p>
                  <p><strong>当前未纳入：</strong>Varnada Lagna、Yogi/Avayogi、Maandi/Gulika；因流派与计算口径差异暂不在本版呈现。</p>
                </aside>
                <div className="parameter-grid">
                  <article><span>黄道与岁差</span><b>{result.engine.zodiac} · {result.engine.ayanamsa}</b><small>岁差值 {result.engine.ayanamsaValue.toFixed(6)}°</small></article>
                  <article><span>出生位置</span><b>{result.input.latitudeDms} · {result.input.longitudeDms}</b><small>UTC{result.input.timezone >= 0 ? "+" : ""}{result.input.timezone}</small></article>
                  <article><span>Lunar month</span><b>{result.panchanga.lunarMonth.name}</b><small>第 {result.panchanga.lunarMonth.number} 月{result.panchanga.lunarMonth.isAdhika ? " · Adhika" : ""}{result.panchanga.lunarMonth.isNija ? " · Nija" : ""}</small></article>
                  <article><span>日出 / 日落</span><b>{result.panchanga.sunrise} / {result.panchanga.sunset}</b><small>昼 {result.panchanga.dayLength} · 夜 {result.panchanga.nightLength}</small></article>
                </div>
                <div className="detail-section"><h4>Jaimini Chara Karaka</h4><div className="compact-pairs">{result.charaKarakas.map(item => <span key={item.karaka}><b>{item.karaka}</b>{item.planet}</span>)}</div></div>
                <div className="detail-section"><h4>特殊 Lagna 与派生点（D1）</h4><ResultTable items={result.specialLagnas} detailed /></div>
                <div className="detail-section"><h4>太阳虚点 | Solar Upagraha（D1）</h4><ResultTable items={result.solarUpagrahas} detailed /></div>
                <div className="detail-section"><h4>分盘总览</h4><div className="varga-summary">{result.divisions.map(division => { const asc = division.items.find(item => item.body === "Ascendant"); const sun = division.items.find(item => item.body === "Sun"); const moon = division.items.find(item => item.body === "Moon"); return <article key={division.factor}><b>{division.label}</b><span>As {asc?.sign} {asc?.formattedDegree}</span><span>Su {sun?.sign} · Mo {moon?.sign}</span></article>; })}</div></div>
              </div>
            )}
            {activeTab === "panchanga" && <div className="panchanga-grid"><div className="panchanga-hero"><Sun size={22} /><span className="section-tag">FIVE-LIMB PANCHANGA</span><h3>{result.panchanga.weekday}</h3><p>{result.panchanga.lunarMonth.name} · 日出至次日日出为 Vedic weekday。</p></div><div className="panchanga-card"><span>Tithi</span><b>{result.panchanga.tithi.paksha} {result.panchanga.tithi.name}</b><small>#{result.panchanga.tithi.number} · {result.panchanga.tithi.startTime}–{result.panchanga.tithi.endTime} · 余 {result.panchanga.tithi.percentLeft}%</small></div><div className="panchanga-card"><span>Nakshatra</span><b>{result.panchanga.nakshatra.name}</b><small>#{result.panchanga.nakshatra.number} · Pada {result.panchanga.nakshatra.pada} · {result.panchanga.nakshatra.lord} · 余 {result.panchanga.nakshatra.percentLeft}%</small></div><div className="panchanga-card"><span>Yoga</span><b>{result.panchanga.yoga.name}</b><small>#{result.panchanga.yoga.number} · {result.panchanga.yoga.startTime}–{result.panchanga.yoga.endTime} · 余 {result.panchanga.yoga.percentLeft}%</small></div><div className="panchanga-card"><span>Karana</span><b>{result.panchanga.karana.name}</b><small>#{result.panchanga.karana.number} · {result.panchanga.karana.startTime}–{result.panchanga.karana.endTime} · 余 {result.panchanga.karana.percentLeft}%</small></div><div className="panchanga-card"><span>Sunrise / Sunset</span><b>{result.panchanga.sunrise} / {result.panchanga.sunset}</b><small>昼 {result.panchanga.dayLength} · 夜 {result.panchanga.nightLength}</small></div></div>}
            {activeTab === "dasa" && <div className="dasa-panel"><div className="dasa-intro"><span className="section-tag">VIMSHOTTARI / 120 YEARS</span><h3>Mahadasa 时间轴</h3><p>按出生时月亮宿与当前参数计算。周期起止日为当地时间近似展示。</p></div><div className="dasa-list">{result.vimsottari.map((period, index) => <div className="dasa-row" key={`${period.lord}-${period.start}`}><span className="dasa-index">{String(index + 1).padStart(2, "0")}</span><b>{period.lord}</b><span>{period.start}</span><span>{period.end}</span><span className="dasa-years">{period.years} 年</span></div>)}</div></div>}
            {activeTab === "fineDasa" && <div className="dasa-panel"><div className="dasa-intro"><span className="section-tag">CURRENT VIMSOTTARI SUB-PERIOD</span><h3>{result.fineDasa.maha} / {result.fineDasa.bhukti} / {result.fineDasa.antara}</h3><p>当前 Mahadasa、Bhukti 与 Antara 由 PyJHora 依次计算；列表显示该 Bhukti 下的九个 Antara。</p></div><div className="dasa-list">{result.fineDasa.antaras.map((period, index) => <div className="dasa-row" key={`${period.lord}-${period.start}`}><span className="dasa-index">{String(index + 1).padStart(2, "0")}</span><b>{period.lord}</b><span>{period.start}</span><span>{period.end}</span><span className="dasa-years">{period.current ? "当前" : ""}</span></div>)}</div></div>}
            {activeTab === "yogas" && <div className="analysis-panel"><span className="section-tag">RULE-TRACEABLE YOGAS</span><h3>已命中的 Yoga</h3>{result.yogas.length ? result.yogas.map(yoga => <article key={yoga.name}><b>{yoga.name}</b><p>{yoga.rule}</p></article>) : <p>当前规则集内没有命中的 Yoga；这不是对全部传统 Yoga 的穷尽性判断。</p>}</div>}
            {activeTab === "muhurta" && <div className="analysis-panel"><span className="section-tag">PANCHANGA MUHURTA WINDOWS</span><h3>地点当日 Muhurta</h3><div className="muhurta-grid">{Object.entries(result.muhurta).map(([key, value]) => <article key={key}><span>{key}</span><b>{value.join(" – ")}</b></article>)}</div><p>时间窗由输入地点、日期、时区与日出日落计算；用途须结合具体传统与场景判断。</p></div>}
            {activeTab === "strength" && <div className="strength-panel"><div className="dasa-intro"><span className="section-tag">SHADBALA / SIXFOLD STRENGTH</span><h3>行星六力</h3><p>按 PyJHora 的 Shadbala 模块计算。Rupa 是 Virupa ÷ 60；“达标”表示高于该行星最低所需强度。</p></div><div className="strength-list">{result.shadbala.map(score => <div className="strength-row" key={score.planet}><b>{score.planet}</b><div className="strength-track"><i style={{ width: `${Math.min(score.rupas / 10 * 100, 100)}%` }} /></div><span>{score.rupas.toFixed(2)} Rupa</span><span className={score.isStrong ? "strength-status good" : "strength-status"}>{score.isStrong ? "达标" : "较弱"}</span></div>)}</div></div>}
            {activeTab === "ashtaka" && <div className="ashtaka-detail"><AshtakavargaPanel scores={result.sarvashtakavarga} /><div className="detail-section"><h4>Bhinna Ashtakavarga（按行星）</h4><div className="bav-table"><div className="bav-row head"><span>行星</span><span>总分</span>{signShort.map(sign => <span key={sign}>{sign}</span>)}</div>{result.bhinnaAshtakavarga.map(item => <div className="bav-row" key={item.body}><b>{item.body}</b><b>{item.total}</b>{item.points.map((point, index) => <span key={index}>{point}</span>)}</div>)}</div></div></div>}
            {activeTab === "transits" && <div className="transit-panel"><div className="transit-intro"><Globe2 size={22} /><span className="section-tag">LIVE TRANSITS</span><h3>当前过境位置</h3><p>以输入地点的时区显示当前时间对应的恒星黄道位置；不与出生盘混合解释。</p></div><ResultTable items={result.transits.filter(item => item.body !== "Ascendant")} /></div>}
            <div className="engine-foot"><span><span className="status-pulse" /> 已计算</span><span>{result.engine.name}</span><span>{result.engine.ayanamsa}</span><span>{result.input.calendar}</span><span>输入：{result.input.date} {result.input.time}</span><button onClick={downloadPdf} disabled={pdfReport.isPending}><Download size={12} /> {pdfReport.isPending ? "生成 PDF…" : "下载 PDF 报告"}</button><button onClick={() => window.print()}><Printer size={12} /> 打印</button></div>
          </>}
          {comparison && <ComparisonPanel {...comparison} />}
        </section>
      </main>
      <ProfileShelf open={profilesOpen} onClose={() => setProfilesOpen(false)} current={currentProfile} onLoad={loadProfile} onCompare={(left, right, labels) => compare.mutate({ left, right }, { onSuccess: data => setComparison({ ...(data as { left: CalculationResult; right: CalculationResult; compatibility: { score: number; maximum: number; method: string; components: { name: string; score: number }[] } }), labels }) })} />
      <footer className="app-footer"><span>Vedic Web Atlas</span><span>Calculation engine: PyJHora + Swiss Ephemeris</span><div><a href="https://github.com/naturalstupid/PyJHora" target="_blank" rel="noreferrer">PyJHora ↗</a><a href="https://www.astro.com/swisseph/swephinfo_e.htm" target="_blank" rel="noreferrer">Swiss Ephemeris License ↗</a></div></footer>
    </div>
  );
}
