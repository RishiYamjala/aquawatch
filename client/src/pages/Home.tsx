import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Droplet,
  HeartPulse,
  MapPin,
  Plus,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  Waves,
  X,
} from "lucide-react";

type Symptom = "Diarrhea" | "Vomiting" | "Fever" | "Stomach Pain";
type WaterSource = "Municipal Tap" | "Bore Well" | "Water Tanker" | "Hand Pump" | "Hand Pump #3";
type Risk = "LOW" | "MODERATE" | "HIGH";
type Report = {
  id: string;
  zone: string;
  symptom: Symptom;
  waterSource: WaterSource;
  timestamp: number;
};
type Screen = "landing" | "dashboard" | "results";

const ZONES = ["Riverside Colony", "Sector 12", "Old Town", "Green Park", "Lakeview"];
const SYMPTOMS: Symptom[] = ["Diarrhea", "Vomiting", "Fever", "Stomach Pain"];
const SOURCES: WaterSource[] = ["Municipal Tap", "Bore Well", "Water Tanker", "Hand Pump", "Hand Pump #3"];
const HOUR = 60 * 60 * 1000;

function seededReport(id: string, zone: string, hoursAgo: number, symptom: Symptom, waterSource: WaterSource): Report {
  return { id, zone, symptom, waterSource, timestamp: Date.now() - hoursAgo * HOUR };
}

function makeSeedReports(): Report[] {
  return [
    // Riverside's deliberately visible cluster: nine reports in 24 hours, seven linked to one pump.
    seededReport("rc-1", "Riverside Colony", 2, "Diarrhea", "Hand Pump #3"),
    seededReport("rc-2", "Riverside Colony", 4, "Vomiting", "Hand Pump #3"),
    seededReport("rc-3", "Riverside Colony", 5, "Diarrhea", "Hand Pump #3"),
    seededReport("rc-4", "Riverside Colony", 7, "Fever", "Hand Pump #3"),
    seededReport("rc-5", "Riverside Colony", 9, "Stomach Pain", "Municipal Tap"),
    seededReport("rc-6", "Riverside Colony", 12, "Diarrhea", "Hand Pump #3"),
    seededReport("rc-7", "Riverside Colony", 15, "Vomiting", "Hand Pump #3"),
    seededReport("rc-8", "Riverside Colony", 18, "Diarrhea", "Bore Well"),
    seededReport("rc-9", "Riverside Colony", 22, "Stomach Pain", "Hand Pump #3"),
    seededReport("rc-old", "Riverside Colony", 61, "Fever", "Municipal Tap"),
    // The remaining neighborhoods have small, varied signals.
    seededReport("s12-1", "Sector 12", 5, "Fever", "Municipal Tap"),
    seededReport("s12-2", "Sector 12", 17, "Stomach Pain", "Bore Well"),
    seededReport("s12-3", "Sector 12", 29, "Diarrhea", "Municipal Tap"),
    seededReport("s12-4", "Sector 12", 38, "Vomiting", "Water Tanker"),
    seededReport("s12-old", "Sector 12", 59, "Fever", "Bore Well"),
    seededReport("ot-1", "Old Town", 8, "Diarrhea", "Municipal Tap"),
    seededReport("ot-2", "Old Town", 24, "Fever", "Hand Pump"),
    seededReport("ot-3", "Old Town", 41, "Stomach Pain", "Municipal Tap"),
    seededReport("ot-old", "Old Town", 65, "Vomiting", "Water Tanker"),
    seededReport("gp-1", "Green Park", 15, "Fever", "Municipal Tap"),
    seededReport("gp-2", "Green Park", 36, "Stomach Pain", "Municipal Tap"),
    seededReport("gp-old-1", "Green Park", 56, "Diarrhea", "Bore Well"),
    seededReport("gp-old-2", "Green Park", 73, "Fever", "Water Tanker"),
    seededReport("lv-1", "Lakeview", 3, "Diarrhea", "Bore Well"),
    seededReport("lv-2", "Lakeview", 21, "Stomach Pain", "Water Tanker"),
    seededReport("lv-3", "Lakeview", 34, "Fever", "Municipal Tap"),
    seededReport("lv-4", "Lakeview", 44, "Vomiting", "Bore Well"),
    seededReport("lv-old-1", "Lakeview", 53, "Fever", "Water Tanker"),
    seededReport("lv-old-2", "Lakeview", 69, "Diarrhea", "Municipal Tap"),
  ];
}

function reportsBetween(reports: Report[], zone: string, fromHours: number, toHours: number) {
  const now = Date.now();
  const start = now - toHours * HOUR;
  const end = now - fromHours * HOUR;
  return reports.filter((report) => report.zone === zone && report.timestamp >= start && report.timestamp < end);
}

function riskFor(count: number): Risk {
  if (count >= 7) return "HIGH";
  if (count >= 3) return "MODERATE";
  return "LOW";
}

function modeSource(reports: Report[]) {
  if (!reports.length) return null;
  const counts = new Map<string, number>();
  reports.forEach((report) => counts.set(report.waterSource, (counts.get(report.waterSource) ?? 0) + 1));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0] ?? null;
}

function riskMeta(risk: Risk) {
  if (risk === "HIGH") return { title: "High risk", short: "HIGH", color: "coral" as const, icon: AlertTriangle };
  if (risk === "MODERATE") return { title: "Moderate", short: "MODERATE", color: "gold" as const, icon: Activity };
  return { title: "Low risk", short: "LOW", color: "green" as const, icon: ShieldCheck };
}

function prettyAgo(timestamp: number) {
  const hours = Math.max(0, Math.floor((Date.now() - timestamp) / HOUR));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function Header({ screen, onHome, onDashboard }: { screen: Screen; onHome: () => void; onDashboard: () => void }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={onHome} aria-label="AquaWatch home">
        <span className="brand-mark"><Droplet size={20} strokeWidth={2.5} /></span>
        <span>Aqua<span className="brand-accent">Watch</span></span>
      </button>
      <nav className="header-nav" aria-label="Main navigation">
        <button className={`nav-link ${screen === "landing" ? "is-active" : ""}`} onClick={onHome}>Overview</button>
        <button className={`nav-link ${screen !== "landing" ? "is-active" : ""}`} onClick={onDashboard}>Live watch</button>
      </nav>
      <button className="header-status" onClick={onDashboard}>
        <span className="live-dot" /> Live community signal <ChevronRight size={14} />
      </button>
    </header>
  );
}

function Landing({ onDashboard, totalRecent }: { onDashboard: () => void; totalRecent: number }) {
  const steps = [
    { icon: HeartPulse, number: "01", title: "Report", body: "Neighbors share symptoms in seconds." },
    { icon: Activity, number: "02", title: "Detect", body: "Local patterns surface before they spread." },
    { icon: Radio, number: "03", title: "Alert", body: "Clear, practical guidance reaches everyone." },
  ];
  return (
    <main>
      <section className="landing-hero page-width">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> COMMUNITY HEALTH, CONNECTED</div>
          <h1>Catch outbreaks<br />before they <em>spread.</em></h1>
          <p className="hero-subtitle">A shared early-warning system for safer water and healthier neighborhoods.</p>
          <div className="hero-actions">
            <button className="button-primary" onClick={onDashboard}>View live dashboard <ArrowRight size={17} /></button>
            <span className="hero-note"><ShieldCheck size={15} /> Community-powered. Privacy-conscious.</span>
          </div>
          <div className="hero-byline"><span className="avatar-stack"><i>AM</i><i>RK</i><i>+</i></span><span>Built for neighbors and local health teams</span></div>
        </div>
        <div className="hero-visual">
          <img className="low-poly-art" src="/manus-storage/low-poly-grid-haikei_13127646.svg" alt="" aria-hidden="true" />
          <div className="visual-topline"><span className="visual-spark"><Sparkles size={15} /></span><span>One shared view of community health</span></div>
          <div className="visual-ripple ripple-one" /><div className="visual-ripple ripple-two" />
          <div className="visual-pin"><span className="visual-pin-icon"><MapPin size={19} fill="currentColor" /></span><span><b>Riverside Colony</b><small>Signal needs attention</small></span><span className="visual-pin-dot" /></div>
          <div className="visual-caption"><span className="visual-caption-icon"><Waves size={19} /></span><span><small>COMMUNITY REPORTS · LAST 48H</small><b>{totalRecent} reports across 5 neighborhoods</b></span><span className="caption-arrow"><ArrowUpRight size={17} /></span></div>
          <div className="visual-coordinates">LOCAL SIGNAL · 01 / 05</div>
        </div>
      </section>
      <section className="steps-section page-width">
        <div className="steps-intro"><span className="eyebrow">A SMALL SIGNAL CAN MAKE A BIG DIFFERENCE</span><h2>See the pattern.<br /><em>Act together.</em></h2></div>
        <div className="steps-list">
          {steps.map(({ icon: Icon, number, title, body }, index) => (
            <div className="step-item" key={title}>
              <div className="step-icon-wrap"><span className="step-icon"><Icon size={20} /></span><span className="step-number">{number}</span></div>
              <div className="step-text"><h3>{title}</h3><p>{body}</p></div>
              {index < steps.length - 1 && <ArrowRight className="step-arrow" size={18} />}
            </div>
          ))}
        </div>
      </section>
      <section className="landing-footer page-width"><div className="footer-rule" /><span><CircleHelp size={14} /> This demo uses sample reports—not a substitute for medical advice.</span><button onClick={onDashboard}>Explore the live watch <ArrowRight size={14} /></button></section>
    </main>
  );
}

type ZoneSummary = { zone: string; current: Report[]; previous: Report[]; risk: Risk; delta: number; source: [string, number] | null };

function ZoneCard({ summary, onClick, index }: { summary: ZoneSummary; onClick: () => void; index: number }) {
  const meta = riskMeta(summary.risk);
  const Icon = meta.icon;
  const rising = summary.delta > 0;
  return (
    <button className={`zone-card risk-${meta.color}`} onClick={onClick} style={{ animationDelay: `${index * 55}ms` }}>
      <span className="zone-card-accent" />
      <div className="zone-card-top">
        <span className={`zone-icon risk-${meta.color}`}><MapPin size={17} /></span>
        <span className={`risk-badge risk-${meta.color}`}><i />{meta.title}</span>
      </div>
      <div className="zone-name-row"><h3>{summary.zone}</h3><ChevronRight className="card-chevron" size={18} /></div>
      <div className="zone-card-meta"><span className="zone-count"><b>{summary.current.length}</b><span>reports <small>· 48h</small></span></span><span className={`trend ${rising ? "trend-up" : summary.delta < 0 ? "trend-down" : "trend-flat"}`}>{rising ? <ArrowUpRight size={16} /> : summary.delta < 0 ? <ArrowDownRight size={16} /> : <span className="trend-equal">—</span>}<b>{Math.abs(summary.delta)}</b><small>vs prev. 48h</small></span></div>
      <div className="zone-card-bottom"><span><Icon size={14} /> {summary.risk === "HIGH" ? "Review alert" : summary.risk === "MODERATE" ? "Keep an eye on it" : "Within usual range"}</span><span className="open-label">View details <ArrowRight size={13} /></span></div>
    </button>
  );
}

function Dashboard({ summaries, totalRecent, onSelectZone, onReport }: { summaries: ZoneSummary[]; totalRecent: number; onSelectZone: (zone: string) => void; onReport: () => void }) {
  const highCount = summaries.filter((summary) => summary.risk === "HIGH").length;
  const moderateCount = summaries.filter((summary) => summary.risk === "MODERATE").length;
  return (
    <main className="page-width dashboard-page">
      <div className="dashboard-heading">
        <div><div className="eyebrow"><span className="live-dot" /> COMMUNITY SIGNAL · LIVE</div><h1>Neighborhood <em>watch</em></h1><p>A clearer picture of how your community is feeling.</p></div>
        <div className="updated-label"><Clock3 size={15} /><span>Updated just now<br /><small>Sample community reports</small></span></div>
      </div>
      <div className="overview-strip">
        <div className="overview-item"><span className="overview-icon teal"><MapPin size={18} /></span><span><b>{summaries.length}</b><small>Neighborhoods</small></span></div>
        <div className="overview-divider" />
        <div className="overview-item"><span className="overview-icon blue"><Activity size={18} /></span><span><b>{totalRecent}</b><small>Reports · last 48h</small></span></div>
        <div className="overview-divider" />
        <div className="overview-item"><span className={`overview-icon ${highCount ? "red" : "green"}`}><AlertTriangle size={18} /></span><span><b>{highCount.toString().padStart(2, "0")}</b><small>High-risk areas</small></span></div>
        <div className="overview-aside"><span className="overview-aside-dot" /><span><b>{moderateCount} areas</b> to keep an eye on</span><ArrowRight size={15} /></div>
      </div>
      {highCount > 0 && <button className="attention-banner" onClick={() => onSelectZone(summaries.find((s) => s.risk === "HIGH")!.zone)}><span className="attention-icon"><AlertTriangle size={18} /></span><span><b>One neighborhood needs a closer look</b><small>Open the Riverside Colony signal to see the likely shared water source and suggested next steps.</small></span><span className="attention-cta">Review signal <ArrowRight size={15} /></span></button>}
      <div className="section-heading"><div><span className="eyebrow">AREA-BY-AREA SIGNAL</span><h2>How is your neighborhood?</h2></div><span className="count-pill"><span className="live-dot" /> {summaries.length} areas monitored</span></div>
      <div className="zones-grid">{summaries.map((summary, index) => <ZoneCard key={summary.zone} summary={summary} onClick={() => onSelectZone(summary.zone)} index={index} />)}</div>
      <div className="risk-legend"><span><i className="legend-dot green" /> 0–2 Low</span><span><i className="legend-dot yellow" /> 3–6 Moderate</span><span><i className="legend-dot red" /> 7+ High reports in the last 48 hours</span></div>
      <footer className="dashboard-footer"><span><ShieldCheck size={15} /> Use these signals to guide outreach—not as a diagnosis.</span><span>DEMO DATA · NO PERSONAL DETAILS COLLECTED</span></footer>
      <button className="floating-report" onClick={onReport}><Plus size={19} strokeWidth={2.5} /><span>Report a symptom</span></button>
    </main>
  );
}

function VolumeChart({ reports, zone }: { reports: Report[]; zone: string }) {
  const now = Date.now();
  const days = Array.from({ length: 5 }, (_, index) => {
    const offset = 4 - index;
    const start = now - (offset + 1) * 24 * HOUR;
    const end = now - offset * 24 * HOUR;
    const count = reports.filter((report) => report.zone === zone && report.timestamp >= start && report.timestamp < end).length;
    const date = new Date(end);
    return { count, label: offset === 0 ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" }), dateLabel: offset === 0 ? "Last 24 hours" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" }) };
  });
  const max = Math.max(5, ...days.map((day) => day.count));
  const points = days.map((day, i) => `${44 + i * 96},${147 - (day.count / max) * 102}`).join(" ");
  const allZero = days.every((day) => day.count === 0);
  return (
    <div className="chart-card">
      <div className="card-heading"><div><span className="eyebrow">RECENT ACTIVITY</span><h3>Reports over time</h3></div><span className="chart-window"><Activity size={14} /> Last 5 days</span></div>
      <div className="chart-area">
        <div className="chart-y-labels"><span>{max}</span><span>{Math.round(max / 2)}</span><span>0</span></div>
        <svg viewBox="0 0 440 190" className="volume-chart" role="img" aria-label={`${zone} reports over the last five days: ${days.map((day) => `${day.label} ${day.count}`).join(", ")}`}>
          {[45, 96, 147].map((y) => <line key={y} x1="28" x2="424" y1={y} y2={y} className="chart-grid-line" />)}
          {days.map((day, i) => {
            const x = 22 + i * 96;
            const barHeight = (day.count / max) * 102;
            return <rect key={`${day.label}-${i}`} x={x} y={147 - barHeight} width="44" height={Math.max(day.count ? 4 : 0, barHeight)} rx="10" className={`chart-bar ${i === 4 ? "chart-bar-current" : ""}`} />;
          })}
          {!allZero && <polyline points={points} fill="none" className="chart-line" />}
          {days.map((day, i) => <circle key={`dot-${i}`} cx={44 + i * 96} cy={147 - (day.count / max) * 102} r={day.count ? 4.5 : 2.5} className={`chart-dot ${day.count ? "has-count" : ""}`} />)}
        </svg>
        <div className="chart-labels">{days.map((day, i) => <span key={`day-${i}`}><b>{day.label}</b><small>{day.count} {day.count === 1 ? "report" : "reports"}</small></span>)}</div>
      </div>
      <div className="chart-footnote"><span><i className="legend-line" /> Reports submitted by neighbors</span><span>Sample reports · rolling 5-day view</span></div>
    </div>
  );
}

function SourceCard({ recent }: { recent: Report[] }) {
  const source = modeSource(recent);
  if (!source) return <div className="source-card source-empty"><span className="source-icon"><Droplet size={20} /></span><span className="eyebrow">LIKELY SHARED SOURCE</span><h3>No common source yet</h3><p>There aren’t any reports from this area in the last 48 hours.</p><div className="source-caution"><CircleHelp size={14} /> More reports can help surface a pattern.</div></div>;
  const [name, count] = source;
  const flagged = recent.length >= 7 && count >= Math.ceil(recent.length * 0.5);
  return (
    <div className={`source-card ${flagged ? "source-alert" : ""}`}>
      <div className="source-head"><span className={`source-icon ${flagged ? "" : "source-icon-soft"}`}><Droplet size={20} /></span>{flagged && <span className="source-flag"><AlertTriangle size={12} /> PATTERN TO CHECK</span>}</div>
      <span className="eyebrow">{flagged ? "POTENTIAL COMMON EXPOSURE" : "MOST REPORTED SOURCE"}</span>
      <h3>{name}</h3>
      <p><strong>{count} of {recent.length}</strong> recent reports list this water source.</p>
      <div className="source-meter"><span style={{ width: `${Math.max(6, (count / recent.length) * 100)}%` }} /></div>
      <div className="source-caution"><CircleHelp size={14} /> A signal to investigate, not confirmation of contamination.</div>
    </div>
  );
}

function Results({ zone, summary, reports, onBack, onShare, sharedMessage }: { zone: string; summary: ZoneSummary; reports: Report[]; onBack: () => void; onShare: () => void; sharedMessage: string }) {
  const meta = riskMeta(summary.risk);
  const Icon = meta.icon;
  const recent = reportsBetween(reports, zone, 0, 48);
  const source = modeSource(recent);
  const [checked, setChecked] = useState<string[]>([]);
  const actions = [
    { id: "boil", label: "Boil water before drinking or cooking", detail: "Bring water to a rolling boil before use." },
    { id: "avoid", label: source ? `Avoid ${source[0]} until it has been checked` : "Use a trusted water source where possible", detail: "Choose a safe alternative while the signal is reviewed." },
    { id: "health", label: "Contact your local health center if symptoms appear", detail: "Seek professional advice, especially for young children or older adults." },
    { id: "share", label: "Share this alert with neighbors", detail: "Help others nearby take sensible precautions." },
  ];
  const toggleAction = (id: string) => setChecked((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return (
    <main className="page-width results-page">
      <button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to neighborhood watch</button>
      <div className={`risk-banner risk-${meta.color}`}>
        <div className="risk-banner-symbol"><Icon size={23} /></div>
        <div className="risk-banner-copy"><span className="banner-eyebrow">AREA HEALTH SIGNAL · LAST 48 HOURS</span><h1>{meta.short} RISK <span className="banner-dash">—</span> {zone}</h1><p>{summary.risk === "HIGH" ? "Reports are above the high-risk threshold. Please review the guidance below." : summary.risk === "MODERATE" ? "A few reports have been shared. Stay aware and check back for changes." : "Current reports are within the low-risk range. Thanks for staying aware."}</p></div>
        <div className="banner-count"><b>{recent.length}</b><span>reports<br />in 48h</span></div>
      </div>
      <div className="results-grid">
        <section className="results-main"><VolumeChart reports={reports} zone={zone} />
          <div className="report-list-card"><div className="card-heading"><div><span className="eyebrow">COMMUNITY CHECK-INS</span><h3>Recent reports</h3></div><span className="count-pill">{recent.length} in 48h</span></div>
            {recent.length ? <div className="report-list">{recent.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 4).map((report) => <div className="report-row" key={report.id}><span className="report-symptom-icon"><HeartPulse size={16} /></span><span className="report-symptom"><b>{report.symptom}</b><small>{report.waterSource}</small></span><span className="report-time">{prettyAgo(report.timestamp)}</span></div>)}</div> : <div className="empty-reports"><Droplet size={18} /> No recent reports in this area.</div>}
          </div>
        </section>
        <aside className="results-side"><SourceCard recent={recent} />
          <div className="actions-card"><div className="card-heading"><div><span className="eyebrow">SIMPLE PRECAUTIONS</span><h3>Recommended actions</h3></div><span className="actions-progress">{checked.length}/{actions.length}</span></div>
            <p className="actions-intro">A few small steps can help protect your household while your community checks this signal.</p>
            <div className="checklist">{actions.map((action) => <button key={action.id} className={`checklist-row ${checked.includes(action.id) ? "checked" : ""}`} onClick={() => { if (action.id === "share") onShare(); toggleAction(action.id); }}><span className="custom-checkbox">{checked.includes(action.id) && <Check size={13} />}</span><span className="checklist-copy"><b>{action.label}</b><small>{action.detail}</small></span></button>)}</div>
            <button className="share-button" onClick={onShare}><Share2 size={15} /> Share this alert <ArrowRight size={14} /></button>
            {sharedMessage && <div className="share-feedback"><CheckCircle2 size={14} /> {sharedMessage}</div>}
          </div>
        </aside>
      </div>
      <div className="results-disclaimer"><ShieldCheck size={15} /><span>This is a community signal based on sample reports—not a diagnosis or a confirmed water-quality test. If you feel unwell, contact a health professional.</span></div>
    </main>
  );
}

function ReportModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (values: { zone: string; symptom: Symptom; waterSource: WaterSource }) => void }) {
  const [zone, setZone] = useState(ZONES[0]);
  const [symptom, setSymptom] = useState<Symptom>("Diarrhea");
  const [waterSource, setWaterSource] = useState<WaterSource>("Hand Pump #3");
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <button className="modal-close" onClick={onClose} aria-label="Close report form"><X size={18} /></button>
        <span className="modal-icon"><Droplet size={21} /></span>
        <span className="eyebrow">A QUICK COMMUNITY CHECK-IN</span><h2 id="report-title">Report a symptom</h2>
        <p className="modal-intro">Reports are anonymous in this demo. Your check-in helps your neighborhood notice patterns sooner.</p>
        <form onSubmit={(event) => { event.preventDefault(); onSubmit({ zone, symptom, waterSource }); }}>
          <label className="field-label" htmlFor="report-zone">Neighborhood</label>
          <select id="report-zone" value={zone} onChange={(event) => setZone(event.target.value)}>{ZONES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <label className="field-label" htmlFor="report-symptom">Symptom</label>
          <select id="report-symptom" value={symptom} onChange={(event) => setSymptom(event.target.value as Symptom)}>{SYMPTOMS.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <label className="field-label" htmlFor="report-source">Water source used</label>
          <select id="report-source" value={waterSource} onChange={(event) => setWaterSource(event.target.value as WaterSource)}>{SOURCES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <div className="privacy-note"><ShieldCheck size={14} /> No name or contact details are collected.</div>
          <button type="submit" className="button-primary modal-submit">Submit report <ArrowRight size={16} /></button>
        </form>
      </section>
    </div>
  );
}

export default function Home() {
  const [reports, setReports] = useState<Report[]>(() => makeSeedReports());
  const [screen, setScreen] = useState<Screen>("landing");
  const [selectedZone, setSelectedZone] = useState<string>(ZONES[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const summaries = useMemo(() => ZONES.map((zone) => {
    const current = reportsBetween(reports, zone, 0, 48);
    const previous = reportsBetween(reports, zone, 48, 96);
    return { zone, current, previous, risk: riskFor(current.length), delta: current.length - previous.length, source: modeSource(current) };
  }).sort((a, b) => {
    const rank: Record<Risk, number> = { HIGH: 0, MODERATE: 1, LOW: 2 };
    return rank[a.risk] - rank[b.risk] || b.current.length - a.current.length || a.zone.localeCompare(b.zone);
  }), [reports]);
  const totalRecent = summaries.reduce((sum, summary) => sum + summary.current.length, 0);
  const activeSummary = summaries.find((summary) => summary.zone === selectedZone) ?? summaries[0];

  const goHome = () => { setScreen("landing"); setToast(""); };
  const goDashboard = () => { setScreen("dashboard"); setToast(""); };
  const openResults = (zone: string) => { setSelectedZone(zone); setShareMessage(""); setScreen("results"); };
  const submitReport = ({ zone, symptom, waterSource }: { zone: string; symptom: Symptom; waterSource: WaterSource }) => {
    const report: Report = { id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, zone, symptom, waterSource, timestamp: Date.now() };
    setReports((current) => [report, ...current]);
    setModalOpen(false);
    setToast(`Report added for ${zone}`);
    window.setTimeout(() => setToast(""), 3200);
  };
  const shareAlert = async () => {
    const message = `AquaWatch ${activeSummary.risk} RISK — ${selectedZone}: ${activeSummary.current.length} community reports in the last 48 hours. Please follow local health guidance.`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `AquaWatch · ${selectedZone}`, text: message });
        setShareMessage("Alert ready to share.");
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        setShareMessage("Alert copied to clipboard.");
      } else {
        setShareMessage("Share this neighborhood alert with your community.");
      }
    } catch {
      setShareMessage("Alert is ready to share with your community.");
    }
    window.setTimeout(() => setShareMessage(""), 3600);
  };

  return (
    <div className={`app-shell screen-${screen}`}>
      <Header screen={screen} onHome={goHome} onDashboard={goDashboard} />
      {screen === "landing" && <Landing onDashboard={goDashboard} totalRecent={totalRecent} />}
      {screen === "dashboard" && <Dashboard summaries={summaries} totalRecent={totalRecent} onSelectZone={openResults} onReport={() => setModalOpen(true)} />}
      {screen === "results" && <Results key={selectedZone} zone={selectedZone} summary={activeSummary} reports={reports} onBack={goDashboard} onShare={shareAlert} sharedMessage={shareMessage} />}
      {modalOpen && <ReportModal onClose={() => setModalOpen(false)} onSubmit={submitReport} />}
      {toast && <div className="toast-message" role="status"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  );
}
