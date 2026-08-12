// Observatory Ledger style: asymmetric editorial canvas, precise interactions, ivory paper, ink navy, solar saffron.
import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  Database,
  ExternalLink,
  Gauge,
  GitBranch,
  Layers3,
  Menu,
  Orbit,
  Play,
  Scale,
  ShieldAlert,
  Sparkles,
  Timer,
  X,
} from "lucide-react";

const heroImage = "/manus-storage/vedic-web-atlas-hero_91921752.jpg";
const orbitImage = "/manus-storage/vedic-web-atlas-orbit_6125be70.jpg";
const paperImage = "/manus-storage/vedic-web-atlas-paper_10d02648.jpg";
const markImage = "/manus-storage/vedic-web-atlas-mark_8cea50c4.png";

const features = [
  { label: "ENGINE", title: "精确星历计算", detail: "把行星位置、日出日落、时区与历法放在同一套可验证的计算链路里。", icon: Orbit, tone: "gold" },
  { label: "METHOD", title: "23 类分盘体系", detail: "从 Rasi / Navamsa 到自定义 D-N，保留专业用户需要的参数空间。", icon: Layers3, tone: "navy" },
  { label: "RESEARCH", title: "Dasa 与过境", detail: "将时间周期、评分和事件搜索组织成可比较、可保存的分析工作台。", icon: Gauge, tone: "clay" },
];

const phases = [
  { n: "01", title: "基础排盘", copy: "出生资料、地点与时区、Rasi / Navamsa、Panchanga、基础报告。", status: "现在" },
  { n: "02", title: "专业分析", copy: "分盘、宫位制、Ayanamsa、Shadbala、Ashtakavarga、Vimsottari Dasa。", status: "下一步" },
  { n: "03", title: "研究工作台", copy: "自定义 D-N、KP、Chakra、Mundane、批量搜索与参数实验。", status: "远景" },
];

const architecture = [
  { label: "01", title: "输入层", copy: "日期 · 时间 · 地点 · 时区", icon: Compass },
  { label: "02", title: "计算层", copy: "Swiss Ephemeris · 规则引擎", icon: Database },
  { label: "03", title: "呈现层", copy: "图表 · 报告 · 可比分析", icon: GitBranch },
];

function smoothTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function AstroChart({ selectedHouse, onSelect }: { selectedHouse: number; onSelect: (house: number) => void }) {
  const cx = 180;
  const cy = 180;
  const points = Array.from({ length: 12 }, (_, i) => {
    const angle = ((i * 30 - 15) * Math.PI) / 180;
    return { x: cx + 142 * Math.cos(angle), y: cy + 142 * Math.sin(angle) };
  });
  return (
    <div className="chart-specimen" aria-label="交互式星盘预览">
      <svg viewBox="0 0 360 360" role="img">
        <circle cx="180" cy="180" r="145" className="chart-ring outer" />
        <circle cx="180" cy="180" r="108" className="chart-ring inner" />
        <circle cx="180" cy="180" r="52" className="chart-core" />
        {Array.from({ length: 12 }, (_, i) => {
          const angle = ((i * 30 - 15) * Math.PI) / 180;
          const x = cx + 108 * Math.cos(angle);
          const y = cy + 108 * Math.sin(angle);
          const x2 = cx + 145 * Math.cos(angle);
          const y2 = cy + 145 * Math.sin(angle);
          return <line key={i} x1={x} y1={y} x2={x2} y2={y2} className={`chart-line ${selectedHouse === i + 1 ? "selected" : ""}`} />;
        })}
        {points.map((p, i) => (
          <g key={i} onClick={() => onSelect(i + 1)} className="chart-house" role="button" tabIndex={0} aria-label={`选择第 ${i + 1} 宫`}>
            <circle cx={p.x} cy={p.y} r="16" className={selectedHouse === i + 1 ? "house-dot active" : "house-dot"} />
            <text x={p.x} y={p.y + 4} textAnchor="middle" className="house-number">{i + 1}</text>
          </g>
        ))}
        <text x="180" y="174" textAnchor="middle" className="chart-sun">☉</text>
        <text x="180" y="198" textAnchor="middle" className="chart-caption">RASI / D1</text>
      </svg>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedHouse, setSelectedHouse] = useState(1);
  const [activeMode, setActiveMode] = useState("Rasi / D1");
  const [birthDate, setBirthDate] = useState("1992-11-08");
  const [birthTime, setBirthTime] = useState("06:42");
  const [place, setPlace] = useState("Chennai, IN");
  const [submitted, setSubmitted] = useState(false);

  const houseInsight = useMemo(() => {
    const insights = ["自我与身体：上升点是所有后续分盘的入口。", "资源与价值：观察第二宫与其宫主的关系。", "沟通与学习：第三宫连接技能、手足与短途移动。", "家庭与根基：第四宫显示内在稳定感与居所。", "创造与子女：第五宫是表达、教育与推演的场域。", "服务与修复：第六宫连接日常、健康与竞争。", "关系与契约：第七宫让盘面进入对照关系。", "共享资源：第八宫提示深层转化与共同资产。", "信念与远行：第九宫连接老师、传统与长途。", "事业与声望：第十宫呈现行动如何被世界看见。", "社群与收益：第十一宫观察愿望、网络与成果。", "撤退与释放：第十二宫指向梦、远方与隐退。"];
    return insights[selectedHouse - 1];
  }, [selectedHouse]);

  function runDemo(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2600);
  }

  return (
    <div className="site-shell">
      <div className="grain" />
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Vedic Web Atlas 首页">
          <img src={markImage} alt="" />
          <span><b>Vedic</b> Web Atlas</span>
        </a>
        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          <a href="#thesis" onClick={() => setMenuOpen(false)}>判断</a>
          <a href="#engine" onClick={() => setMenuOpen(false)}>引擎</a>
          <a href="#roadmap" onClick={() => setMenuOpen(false)}>路线</a>
          <button className="nav-cta" onClick={() => { smoothTo("workspace"); setMenuOpen(false); }}>试用工作台 <ArrowUpRight size={15} /></button>
        </nav>
        <button className="menu-toggle" aria-label="打开菜单" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> FIELD NOTE  /  2026.08</div>
            <h1>把星盘，<em>带到</em><br /><span>浏览器里。</span></h1>
            <p className="hero-lede">一份关于 Jagannatha Hora 的可行性研究，正在变成一个面向占星师的开放式研究工作台。</p>
            <div className="hero-actions">
              <button className="button button-primary" onClick={() => smoothTo("workspace")}>打开排盘实验 <ArrowDownRight size={17} /></button>
              <button className="text-link" onClick={() => smoothTo("thesis")}>先看研究判断 <ChevronRight size={16} /></button>
            </div>
            <div className="hero-meta"><span>RESEARCH PROTOTYPE</span><span className="meta-line" /><span>NO LOGIN REQUIRED</span></div>
          </div>
          <div className="hero-art" style={{ backgroundImage: `url(${heroImage})` }}>
            <div className="hero-art-caption"><span>01</span><span>AN INSTRUMENT<br />FOR SERIOUS STUDY</span></div>
            <div className="orbit-stamp"><Orbit size={15} /><span>JH / WEB</span></div>
          </div>
        </section>

        <section className="ticker" aria-label="项目摘要"><div>FREE WINDOWS SOFTWARE</div><div>→</div><div>WEB RECONSTRUCTION</div><div>→</div><div>CALCULATION / METHOD / EVIDENCE</div><div>→</div><div>WEB RECONSTRUCTION</div></section>

        <section className="thesis-section section-pad" id="thesis">
          <div className="section-index">02 <span>THE THESIS</span></div>
          <div className="thesis-grid">
            <div className="section-title"><p className="kicker">我们的判断</p><h2>不是把旧软件<br /><em>搬上网。</em></h2></div>
            <div className="thesis-body"><p className="lead-paragraph">**可以做，而且值得做。** 但它真正的形态，不是一个被压扁的 Windows 窗口，而是一座让占星师能够保存、比较、验证并分享计算结果的数字天文台。</p><p>Jagannatha Hora 的难点从来不在画出一个菱形星盘。难点在于星历、地点、时区、分盘、Dasa 和数百条规则如何组成一条可信的计算链路。</p><div className="quote-mark">“</div><blockquote>把计算过程变成可见的证据，才能让 Web 版本真正服务于研究。</blockquote><div className="source-note"><span>READ THE FULL NOTE</span><a href="https://www.vedicastrologer.org/jh/features.htm" target="_blank" rel="noreferrer">VedicAstrologer.org <ExternalLink size={12} /></a></div></div>
          </div>
        </section>

        <section className="feature-section" id="engine">
          <div className="feature-image" style={{ backgroundImage: `url(${orbitImage})` }}><div className="image-label">THE ENGINE<br /><span>WHAT MAKES IT HARD</span></div></div>
          <div className="feature-content"><div className="section-index">03 <span>THE ENGINE</span></div><p className="kicker">把复杂拆成三层</p><h2>从行星位置，<br /><em>到一份可信的判断。</em></h2><p className="section-intro">一个可用的 Web 版本，需要把计算、方法和呈现彼此分开，又让它们在同一张图表上相遇。</p><div className="feature-list">{features.map(({ label, title, detail, icon: Icon, tone }) => <div className={`feature-row ${tone}`} key={label}><div className="feature-icon"><Icon size={20} /></div><div><span className="mini-label">{label}</span><h3>{title}</h3><p>{detail}</p></div><ChevronRight className="feature-arrow" size={18} /></div>)}</div></div>
        </section>

        <section className="workspace-section section-pad" id="workspace">
          <div className="section-index">04 <span>THE WORKSPACE</span></div>
          <div className="workspace-heading"><div><div className="atlas-lockup"><img src={markImage} alt="" /><span>ATLAS SPECIMEN / 04</span></div><p className="kicker">可操作的原型</p><h2>先把一个结果，<br /><em>算清楚。</em></h2></div><p>输入一组出生资料，试着在图表上选择不同宫位。这里展示的是交互方向，不是最终的生产级星历计算器。</p></div>
          <div className="workspace-grid">
            <form className="input-panel" onSubmit={runDemo}><div className="panel-top"><span className="mini-label">CHART INPUT</span><span className="status-dot"><i /> READY</span></div><label>出生日期<input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} /></label><div className="split-input"><label>当地时间<input type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)} /></label><label>历法<select defaultValue="gregorian"><option value="gregorian">Gregorian</option><option value="julian">Julian</option></select></label></div><label>地点<input value={place} onChange={e => setPlace(e.target.value)} /></label><label>Ayanamsa<select defaultValue="lahiri"><option value="lahiri">Lahiri</option><option value="raman">Raman</option><option value="tropical">Tropical / none</option></select></label><button className="button button-primary full" type="submit">{submitted ? <><Check size={16} /> 已生成示例结果</> : <><Play size={15} /> 生成研究预览</>}</button><p className="form-note"><CircleHelp size={13} /> 当前为前端交互原型，尚未连接真实星历 API。</p></form>
            <div className="chart-panel"><div className="panel-top"><div className="mode-tabs">{["Rasi / D1", "Navamsa / D9", "Panchanga"].map(mode => <button className={activeMode === mode ? "active" : ""} key={mode} onClick={() => setActiveMode(mode)}>{mode}</button>)}</div><span className="mini-label">PREVIEW</span></div><div className="chart-layout"><AstroChart selectedHouse={selectedHouse} onSelect={setSelectedHouse} /><div className="chart-readout"><span className="mini-label">SELECTED HOUSE</span><strong>{selectedHouse.toString().padStart(2, "0")}</strong><h3>{activeMode}</h3><p>{houseInsight}</p><div className="readout-rule" /><div className="readout-row"><span>METHOD</span><b>Lahiri</b></div><div className="readout-row"><span>STATUS</span><b className="verified">Prototype</b></div></div></div><div className="chart-foot"><span>Click any numbered node to inspect the research context.</span><span>SVG SPECIMEN / 360°</span></div></div>
          </div>
        </section>

        <section className="risk-section"><div className="evidence-orbit" aria-hidden="true"><Orbit size={92} strokeWidth={0.6} /></div><div className="risk-art" style={{ backgroundImage: `url(${paperImage})` }}><div className="risk-art-label"><ShieldAlert size={17} /><span>READ BEFORE BUILD</span></div></div><div className="risk-content"><div className="section-index">05 <span>THE FRICTION</span></div><p className="kicker">真正的风险不在 UI</p><h2>先问清楚：<br /><em>谁拥有这套计算？</em></h2><p className="section-intro">Swiss Ephemeris、PyJHora 与原始 Jagannatha Hora 之间，存在不同的代码、数据与授权边界。商业化之前，许可证审查和结果黄金测试集必须先于漂亮的界面。</p><div className="risk-note"><Scale size={18} /><div><b>合规优先</b><p>AGPL 与专业许可证是两条不同的路。原型可以先展示交互，但生产版本必须完成依赖链核查。</p></div></div><a className="text-link" href="https://www.astro.com/swisseph/swephinfo_e.htm" target="_blank" rel="noreferrer">查看 Swiss Ephemeris 条款 <ExternalLink size={14} /></a></div></section>

        <section className="roadmap-section section-pad" id="roadmap"><div className="section-index">06 <span>THE ROADMAP</span></div><div className="roadmap-header"><div><p className="kicker">不要从“大而全”开始</p><h2>先做一个<br /><em>垂直切片。</em></h2></div><div className="roadmap-note"><Timer size={18} /><p>每一步都应当回答一个问题：用户是否愿意持续使用它？</p></div></div><div className="phase-list">{phases.map(phase => <div className="phase-row" key={phase.n}><span className="phase-number">{phase.n}</span><div className="phase-main"><h3>{phase.title}</h3><p>{phase.copy}</p></div><span className={`phase-status ${phase.status === "现在" ? "current" : ""}`}>{phase.status}</span><ArrowUpRight size={18} className="phase-arrow" /></div>)}</div></section>

        <section className="closing-section"><div className="closing-orbit"><Orbit size={64} strokeWidth={0.8} /></div><div className="closing-copy"><p className="kicker">A RESEARCH-FIRST ASTROLOGY WORKSPACE</p><h2>看见引擎<br /><em>之下的星盘。</em></h2><button className="button button-light" onClick={() => smoothTo("workspace")}>开始一次预览 <ArrowUpRight size={16} /></button></div><div className="closing-footer"><span className="footer-brand"><img src={markImage} alt="" />Vedic Web Atlas</span><span>Built for careful study.</span><span>© 2026</span></div></section>
      </main>
    </div>
  );
}
