import { useMemo, useState, useEffect } from 'react';

/* ------------------------------------------------------------------ *
 * Viridis - Dashboard
 * Grid Stress Intelligence Platform command center.
 * ------------------------------------------------------------------ */

const C = {
  bg: '#0a0f1a',
  side: '#0d1524',
  border: '#16202f',
  panel: '#0d1524',
  panelSoft: '#101a2b',
  panelBorder: '#16202f',
  divider: '#1a2637',
  text: '#e8edf4',
  muted: '#7e8da3',
  dim: '#5b6b82',
  emerald: '#10b981',
  cyan: '#22d3ee',
  yellow: '#facc15',
  red: '#ff545f',
  orange: '#fb923c',
};

const sans = "var(--sans, 'Space Grotesk', system-ui, sans-serif)";
const mono = "var(--mono, 'JetBrains Mono', ui-monospace, monospace)";
const card = { background: C.panel, border: `1px solid ${C.panelBorder}`, borderRadius: 14 };
const kicker = { fontFamily: mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted };

const facilities = {
  GPZ4: { label: 'Georgia Power Zone 4', detail: 'Atlanta metro balancing zone', station: '02336000', node: 'ATL-Z4', demand: 78, waterBase: 1923, savings: 12450, carbon: 12.4 },
  FULTON: { label: 'Fulton Hub', detail: 'USGS 02336000 - Chattahoochee', station: '02336000', node: 'FTN-03', demand: 62, waterBase: 1485, savings: 8140, carbon: 8.2 },
  FORSYTH: { label: 'Forsyth Node', detail: 'USGS 02335450 - flow stable', station: '02335450', node: 'FSY-02', demand: 54, waterBase: 1320, savings: 6920, carbon: 6.7 },
  HENRY: { label: 'Henry County', detail: 'Thermal discharge watch', station: '02203950', node: 'HEN-04', demand: 71, waterBase: 1765, savings: 10360, carbon: 10.8 },
  DOUGLAS: { label: 'Douglas Plant', detail: 'Sweetwater Creek peaker risk', station: '02337000', node: 'DGL-01', demand: 84, waterBase: 2050, savings: 14990, carbon: 14.1 },
};

const contributors = [
  ['Douglas AI campus', 42],
  ['Henry logistics cooling', 27],
  ['Fulton commercial load', 19],
  ['Forsyth residential demand', 12],
];

const workloads = [
  { name: 'Douglas AI Training Cluster', load: '18 MW', state: 'Shiftable', tone: C.yellow },
  { name: 'Fulton Inference API Fleet', load: '9 MW', state: 'Protected', tone: C.emerald },
  { name: 'Henry Batch Analytics', load: '14 MW', state: 'Deferred', tone: C.cyan },
  { name: 'Forsyth Simulation Jobs', load: '6 MW', state: 'Running', tone: C.emerald },
];

function VMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="vd_mark" x1="8" y1="10" x2="46" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22d3ee" />
          <stop offset="0.5" stopColor="#10b981" />
          <stop offset="1" stopColor="#a7f3d0" />
        </linearGradient>
      </defs>
      <path d="M10 13 L28 44 L46 13" stroke="url(#vd_mark)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="28" cy="13" r="3.6" fill="#34d399" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="7" height="7" rx="2" fill="#9fb0c6" />
      <rect x="11" y="2" width="7" height="7" rx="2" fill="#9fb0c6" />
      <rect x="2" y="11" width="7" height="7" rx="2" fill="#9fb0c6" />
      <rect x="11" y="11" width="7" height="7" rx="2" fill="#9fb0c6" />
    </svg>
  );
}

function MiniIcon({ type }) {
  const paths = {
    pulse: 'M3 11h3l2-6 4 12 2-6h3',
    droplet: 'M10 2C7 6 5 8.6 5 12a5 5 0 0 0 10 0c0-3.4-2-6-5-10Z',
    leaf: 'M16 4C8 4 4 8 4 16c8 0 12-4 12-12ZM4 16c3-4 6-6 12-12',
    bolt: 'M11 2 4 12h6l-1 6 7-10h-6l1-6Z',
  };

  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d={paths[type]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({ label, value, unit, detail, tone, icon }) {
  return (
    <section className="vd-stat" style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <span style={kicker}>{label}</span>
        <span style={{ color: tone, display: 'grid', placeItems: 'center' }}><MiniIcon type={icon} /></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
        <strong style={{ fontFamily: mono, fontSize: 30, lineHeight: 1, letterSpacing: '-0.03em', color: tone }}>{value}</strong>
        {unit && <span style={{ fontFamily: mono, color: C.dim, fontSize: 11 }}>{unit}</span>}
      </div>
      <div style={{ marginTop: 10, color: C.muted, fontFamily: mono, fontSize: 10 }}>{detail}</div>
    </section>
  );
}

function ForecastChart({ data, mitigated, hour }) {
  const points = data.map((value, i) => `${(i / (data.length - 1)) * 100},${100 - value}`).join(' ');
  const green = mitigated.map((value, i) => `${(i / (mitigated.length - 1)) * 100},${100 - value}`).join(' ');
  const x = (hour / 23) * 100;
  const y = 100 - data[hour];

  return (
    <section className="vd-chart-card" style={{ ...card, padding: 18 }}>
      <div className="vd-card-head">
        <div>
          <div style={kicker}>Georgia Power Zone 4 Forecast</div>
          <h2>Grid stress projection</h2>
        </div>
        <div className="vd-legend">
          <span><i style={{ background: C.red }} /> Current scenario</span>
          <span><i style={{ background: C.emerald }} /> After mitigation</span>
        </div>
      </div>

      <div className="vd-chart-wrap">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="vd-chart" aria-label="24 hour grid stress forecast">
          <rect x="0" y="0" width="100" height="100" fill="#0b1322" />
          <rect x="0" y="62" width="100" height="38" fill="rgba(16,185,129,0.08)" />
          <rect x="0" y="34" width="100" height="28" fill="rgba(250,204,21,0.08)" />
          <rect x="58" y="0" width="22" height="100" fill="rgba(255,84,95,0.12)" />
          {[20, 40, 60, 80].map((n) => (
            <line key={n} x1="0" x2="100" y1={n} y2={n} stroke="rgba(126,141,163,0.16)" strokeWidth="0.4" />
          ))}
          {[17, 33, 50, 67, 83].map((n) => (
            <line key={n} x1={n} x2={n} y1="0" y2="100" stroke="rgba(126,141,163,0.09)" strokeWidth="0.35" />
          ))}
          <polyline points={green} fill="none" stroke={C.emerald} strokeWidth="2.4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
          <polyline points={points} fill="none" stroke={C.red} strokeWidth="2.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          <line x1={x} x2={x} y1="0" y2="100" stroke="rgba(232,237,244,0.5)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          <circle cx={x} cy={y} r="1.8" fill="#f8fafc" stroke={C.red} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="vd-y-axis">
          <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
        </div>
      </div>

      <div className="vd-x-axis">
        <span>00</span><span>04</span><span>08</span><span>12</span><span>16</span><span>20</span><span>23</span>
      </div>
    </section>
  );
}

function ImpactRow({ label, value, max, tone }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 7 }}>
        <span style={{ color: C.muted }}>{label}</span>
        <span style={{ fontFamily: mono, color: C.text }}>{value}</span>
      </div>
      <div className="vd-bar">
        <span style={{ width: `${max}%`, background: tone }} />
      </div>
    </div>
  );
}

function Pill({ children, tone }) {
  return (
    <span style={{
      border: `1px solid ${tone}66`,
      color: tone,
      background: `${tone}14`,
      borderRadius: 999,
      padding: '3px 8px',
      fontFamily: mono,
      fontSize: 9,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

function CoreLogger({ facility, mitigation }) {
  const seedLogs = useMemo(() => ([
    { id: 1, time: '09:53:43', type: 'INFO', text: 'Georgia Power peak window model refreshed for 14:00-19:00 demand.' },
    { id: 2, time: '09:53:40', type: 'WATER', text: 'Water impact model recalculated from current grid stress score.' },
    { id: 3, time: '09:53:37', type: 'INFO', text: 'Facility load snapshot received for Fulton, Forsyth, Henry, and Douglas.' },
    { id: 4, time: '09:53:34', type: 'WARN', text: 'Peaker plant risk rising as afternoon cooling demand increases.' },
    { id: 5, time: '09:53:31', type: 'INFO', text: 'Non-urgent AI training jobs marked eligible for overnight deferment.' },
    { id: 6, time: '09:53:24', type: 'WATER', text: 'Cooling overhead estimate linked to local river flow conditions.' },
  ]), []);
  const [logs, setLogs] = useState(seedLogs);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timestamp = now.toTimeString().split(' ')[0];
      const criticalLogs = [
        { type: 'WARN', text: `${facility.label} is approaching the Georgia Power peak demand window.` },
        { type: 'CRIT', text: 'Peaker dispatch probability exceeds 80% unless shiftable compute is deferred.' },
        { type: 'WATER', text: 'Projected peaker cooling demand increased with current stress score.' },
      ];
      const nominalLogs = [
        { type: 'INFO', text: `${facility.label} load remains below critical peak threshold.` },
        { type: 'WATER', text: `Water impact estimate synced with station ${facility.station}.` },
        { type: 'INFO', text: 'Shiftable workload queue checked; no urgent deferral required.' },
      ];
      const mitigationLogs = [
        { type: 'SUCCESS', text: 'Deferred load accepted: AI training shifted to 23:00-05:00.' },
        { type: 'WATER', text: 'Water overhead reduced after peak-hour compute deferment.' },
        { type: 'INFO', text: 'Mitigation action recorded in the operator audit trail.' },
      ];
      const pool = mitigation ? mitigationLogs : facility.demand >= 70 ? criticalLogs : nominalLogs;
      const next = pool[Math.floor(Math.random() * pool.length)];
      setLogs((items) => [{ id: Date.now(), time: timestamp, ...next }, ...items.slice(0, 13)]);
    }, 3000);

    return () => clearInterval(interval);
  }, [facility, mitigation]);

  const logColor = (type) => {
    if (type === 'CRIT') return C.red;
    if (type === 'WARN') return C.yellow;
    if (type === 'SUCCESS') return C.emerald;
    if (type === 'WATER') return C.cyan;
    return '#9fb0c6';
  };

  return (
    <section style={{ ...card, padding: 18, background: '#050a16' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${C.divider}` }}>
        <div style={{ textAlign: 'left' }}>
          <div style={kicker}>Grid, water, and workload events</div>
          <h2 style={{ margin: '5px 0 0', textAlign: 'left' }}>Mitigation Audit Trail</h2>
        </div>
        <span style={{ ...kicker, color: C.emerald, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.emerald, animation: 'vdBlink 2.2s ease-in-out infinite' }} />
          Live stream
        </span>
      </div>
      <div className="vd-core-log">
        {logs.map((log) => (
          <div key={log.id} className={`vd-log-line ${log.type === 'SUCCESS' ? 'success' : ''}`}>
            <span style={{ color: C.dim }}>[{log.time}]</span>
            <b style={{ color: logColor(log.type) }}>[{log.type}]</b>
            <span>{log.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  const [facilityKey, setFacilityKey] = useState('GPZ4');
  const [season, setSeason] = useState('Summer');
  const [hour, setHour] = useState(14);
  const [mitigation, setMitigation] = useState(false);

  useEffect(() => {
    const clock = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clock);
  }, []);

  const model = facilities[facilityKey];
  const forecast = useMemo(() => {
    const seasonalBoost = season === 'Summer' ? 7 : -4;
    return Array.from({ length: 24 }, (_, h) => {
      const afternoonPeak = 38 * Math.exp(-Math.pow((h - 16) / 3.8, 2));
      const morningRamp = 15 * Math.exp(-Math.pow((h - 9) / 4.8, 2));
      const overnightDip = h < 5 || h > 22 ? -10 : 0;
      return Math.max(18, Math.min(96, Math.round(model.demand - 24 + seasonalBoost + afternoonPeak + morningRamp + overnightDip)));
    });
  }, [model, season]);

  const mitigated = forecast.map((value, h) => {
    const shiftWindow = h >= 13 && h <= 19;
    const relief = shiftWindow ? 60 : 24;
    return Math.max(18, Math.round(value * (1 - relief / 100)));
  });

  const stress = mitigation ? mitigated[hour] : forecast[hour];
  const rawStress = forecast[hour];
  const water = Math.round(stress * model.waterBase);
  const peakerRisk = rawStress >= 76 ? 'Critical' : rawStress >= 62 ? 'Elevated' : 'Stable';
  const riskTone = peakerRisk === 'Critical' ? C.red : peakerRisk === 'Elevated' ? C.yellow : C.emerald;
  const projectedRisk = mitigated[hour] >= 76 ? 'Critical' : mitigated[hour] >= 62 ? 'Elevated' : 'Stable';
  const projectedRiskTone = projectedRisk === 'Critical' ? C.red : projectedRisk === 'Elevated' ? C.yellow : C.emerald;
  const savings = mitigation ? model.savings : Math.round(model.savings * 0.32);
  const shiftedMw = mitigation ? 32 : 0;
  const recommendedWaterReduction = Math.max(0, Math.round((rawStress - mitigated[hour]) * model.waterBase));
  const tp = time.toLocaleTimeString().split(':');

  return (
    <div className="vd-shell" style={{ maxWidth: '100vw', background: C.bg, fontFamily: sans, color: C.text, fontSize: 13 }}>
      <style>{`
        *{box-sizing:border-box}
        button,input,select{font:inherit}
        .vd-shell{display:grid;grid-template-columns:208px 1fr;height:100vh;overflow:hidden}
        .vd-nav{position:relative;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;cursor:pointer;color:#cbd6e6;font-size:13px;font-weight:500;transition:background .15s}
        .vd-nav.active{background:rgba(16,185,129,0.12)}
        .vd-nav.active::before{content:'';position:absolute;left:0;top:9px;bottom:9px;width:3px;border-radius:0 3px 3px 0;background:#10b981}
        .vd-main{padding:20px 24px 24px;display:grid;gap:14px;grid-template-rows:auto auto 1fr}
        .vd-stat-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
        .vd-stat{padding:16px;min-height:112px}
        .vd-workspace{display:grid;grid-template-columns:300px minmax(420px,1.5fr) minmax(260px,.8fr);gap:14px;align-items:stretch}
        .vd-bottom{display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:14px;min-height:238px}
        .vd-card-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:14px}
        h2{font-size:16px;line-height:1.1;margin:5px 0 0;color:#f8fafc;font-weight:600;letter-spacing:0}
        .vd-control{width:100%;background:#0a1220;color:#dbe6f5;border:1px solid #1d2b3f;border-radius:9px;padding:9px 10px;outline:none}
        .vd-segment{display:grid;grid-template-columns:1fr 1fr;gap:6px}
        .vd-segment button,.vd-action{border:1px solid #1d2b3f;border-radius:9px;background:#0a1220;color:#8fa1ba;padding:9px 10px;cursor:pointer}
        .vd-segment button.active{border-color:rgba(16,185,129,.7);background:rgba(16,185,129,.13);color:#d1fae5}
        .vd-slider{width:100%;accent-color:#10b981}
        .vd-chart-wrap{position:relative;height:286px;border:1px solid #1a2637;border-radius:12px;overflow:hidden;background:#0b1322}
        .vd-chart{position:absolute;inset:0;width:100%;height:100%}
        .vd-y-axis{position:absolute;left:10px;top:9px;bottom:9px;display:flex;flex-direction:column;justify-content:space-between;font:9px ${mono};color:#5b6b82;pointer-events:none}
        .vd-x-axis{display:flex;justify-content:space-between;color:#5b6b82;font:10px ${mono};padding:8px 8px 0 28px}
        .vd-legend{display:flex;gap:12px;flex-wrap:wrap;justify-content:flex-end;color:#8fa1ba;font:10px ${mono}}
        .vd-legend span{display:flex;align-items:center;gap:6px}
        .vd-legend i{width:8px;height:8px;border-radius:50%;display:inline-block}
        .vd-bar{height:8px;background:#0a1220;border:1px solid #1d2b3f;border-radius:99px;overflow:hidden}
        .vd-bar span{display:block;height:100%;border-radius:99px}
        .vd-feed{font-family:${mono};font-size:11px;line-height:1.75;color:#a7b5ca}
        .vd-feed b{font-weight:500}
        .vd-core-log{height:230px;overflow:auto;display:flex;flex-direction:column;gap:9px;padding-right:6px;font-family:${mono};font-size:11px;line-height:1.5;color:#d7e0ef}
        .vd-log-line{display:grid;grid-template-columns:78px 72px 1fr;gap:10px;align-items:start;border-bottom:1px solid rgba(26,38,55,.72);padding-bottom:8px}
        .vd-log-line b{font-weight:600}
        .vd-log-line.success{border-bottom-color:rgba(16,185,129,.35)}
        .vd-action{background:linear-gradient(135deg,rgba(16,185,129,.18),rgba(34,211,238,.08));border-color:rgba(16,185,129,.46);color:#d1fae5;font-family:${mono};font-size:11px;letter-spacing:.08em;text-transform:uppercase}
        .vd-action.off{background:#0a1220;border-color:#26364e;color:#9fb0c6}
        @keyframes vdBlink{0%,100%{opacity:1}50%{opacity:.25}}
        @media(max-width:1180px){
          .vd-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
          .vd-workspace,.vd-bottom{grid-template-columns:1fr}
          .vd-chart-wrap{height:250px}
        }
        @media(max-width:760px){
          .vd-shell{grid-template-columns:1fr}
          .vd-shell>aside{display:none!important}
          .vd-stat-grid{grid-template-columns:1fr}
          .vd-main{padding:14px;gap:12px}
          .vd-card-head{align-items:flex-start;flex-direction:column}
          .vd-legend{justify-content:flex-start}
          .vd-chart-wrap{height:230px}
          header{padding:12px 14px!important;align-items:flex-start!important;gap:12px;flex-wrap:wrap}
        }
      `}</style>

      <aside style={{ background: C.side, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', padding: '16px 12px', height: '100vh', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 16px' }}>
          <VMark size={24} />
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '0.13em', color: '#f8fafc' }}>VIRIDIS</span>
        </div>
        <div style={{ ...kicker, fontSize: 9, letterSpacing: '0.16em', color: '#4d5d75', padding: '4px 10px 6px' }}>Monitor</div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div className="vd-nav active">
            <span style={{ position: 'relative', display: 'flex' }}><DashboardIcon /></span>
            <span style={{ position: 'relative' }}>Dashboard</span>
          </div>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 8px 2px', marginTop: 6, borderTop: `1px solid ${C.border}` }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(150deg,#0f766e,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#04140f' }}>AM</div>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>Atlanta Metro</div>
              <div style={{ fontFamily: mono, fontSize: 9, color: C.dim }}>ops - admin</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: `1px solid ${C.border}`, background: 'rgba(11,18,31,0.7)', position: 'sticky', top: 0, zIndex: 5, backdropFilter: 'blur(8px)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '0', color: '#f8fafc' }}>Dashboard</h1>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: mono, fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', color: C.emerald, border: '1px solid rgba(16,185,129,0.4)', borderRadius: 20, padding: '2px 8px' }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.emerald, animation: 'vdBlink 2.2s ease-in-out infinite' }} />LIVE
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Pill tone={riskTone}>{peakerRisk} risk</Pill>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', fontFamily: mono }}>
                <span style={{ fontSize: 17, fontWeight: 500, color: '#f1f5f9' }}>{tp[0]}:{tp[1]}</span>
                <span style={{ fontSize: 11, color: C.dim, marginLeft: 1 }}>:{tp[2] || '00'}</span>
              </div>
              <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.06em', color: C.dim, marginTop: 1 }}>
                {time.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} - EDT
              </div>
            </div>
          </div>
        </header>

        <main className="vd-main">
          <div className="vd-stat-grid">
            <StatCard label="Grid Stress" value={stress} unit="/100" detail={mitigation ? `Reduced from ${rawStress} after deferment` : `Projected pressure at ${String(hour).padStart(2, '0')}:00`} tone={riskTone} icon="pulse" />
            <StatCard label="Water Impact" value={water.toLocaleString()} unit="gal/hr" detail="Estimated peaker cooling demand" tone={C.cyan} icon="droplet" />
            <StatCard label="Carbon Risk" value={`+${model.carbon}`} unit="%" detail="Extra emissions from peak dispatch" tone={C.orange} icon="leaf" />
            <StatCard label="Savings" value={`$${savings.toLocaleString()}`} unit="/hr" detail={mitigation ? `${shiftedMw} MW deferred from peak hours` : 'Available value if load is deferred'} tone={C.emerald} icon="bolt" />
          </div>

          <div className="vd-workspace">
            <section style={{ ...card, padding: 18 }}>
              <div className="vd-card-head">
                <div>
                  <div style={kicker}>Control Panel</div>
                  <h2>Georgia operating conditions</h2>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 16 }}>
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={kicker}>Georgia Facility</span>
                  <select className="vd-control" value={facilityKey} onChange={(e) => setFacilityKey(e.target.value)}>
                    {Object.entries(facilities).map(([key, facility]) => (
                      <option key={key} value={key}>{facility.label} - {facility.node}</option>
                    ))}
                  </select>
                </label>

                <div style={{ display: 'grid', gap: 8 }}>
                  <span style={kicker}>Season</span>
                  <div className="vd-segment">
                    {['Summer', 'Winter'].map((item) => (
                      <button key={item} className={season === item ? 'active' : ''} onClick={() => setSeason(item)} type="button">{item}</button>
                    ))}
                  </div>
                </div>

                <label style={{ display: 'grid', gap: 10 }}>
                  <span style={kicker}>Hour Simulation</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: mono }}>
                    <strong style={{ color: '#f8fafc', fontSize: 22 }}>{String(hour).padStart(2, '0')}:00</strong>
                    <Pill tone={hour >= 14 && hour <= 19 ? C.red : C.emerald}>{hour >= 14 && hour <= 19 ? 'Peak window' : 'Off peak'}</Pill>
                  </div>
                  <input className="vd-slider" type="range" min="0" max="23" value={hour} onChange={(e) => setHour(Number(e.target.value))} />
                </label>

                <button className={`vd-action ${mitigation ? '' : 'off'}`} type="button" onClick={() => setMitigation((value) => !value)}>
                  {mitigation ? 'Load Deferred' : 'Defer Load'}
                </button>
              </div>
            </section>

            <ForecastChart data={forecast} mitigated={mitigated} hour={hour} />

            <section style={{ ...card, padding: 18 }}>
              <div className="vd-card-head">
                <div>
                  <div style={kicker}>Environmental Impact</div>
                  <h2>Water and peaker impact</h2>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 16 }}>
                <ImpactRow label="Peaker cooling water" value={`${water.toLocaleString()} gal/hr`} max={Math.min(100, water / 1700)} tone={C.cyan} />
                <ImpactRow label="Backup plant risk" value={peakerRisk} max={rawStress} tone={riskTone} />
                <ImpactRow label="Deferrable compute load" value={`${Math.round(stress * 1.3)} MW`} max={Math.min(100, stress * 1.1)} tone={C.yellow} />
              </div>
              <div style={{ marginTop: 18, padding: 14, border: `1px solid ${C.divider}`, borderRadius: 12, background: '#0a1220' }}>
                <div style={kicker}>Equivalent Impact</div>
                <div style={{ display: 'grid', gap: 9, marginTop: 11, fontFamily: mono, color: '#cbd6e6' }}>
                  <span>Comparable to {Math.round(water / 120)} homes worth of hourly cooling demand</span>
                  <span>About {Math.round(water / 520)} municipal water trucks per hour</span>
                  <span>{Math.round((rawStress - stress) * 7)} trees worth of avoided carbon offset after deferment</span>
                </div>
              </div>
            </section>
          </div>

          <div className="vd-bottom">
            <section style={{ ...card, padding: 18 }}>
              <div className="vd-card-head">
                <div>
                  <div style={kicker}>Georgia Facilities</div>
                  <h2>Where peak demand is coming from</h2>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 14 }}>
                {contributors.map(([name, value]) => (
                  <ImpactRow key={name} label={name} value={`${value}%`} max={value} tone={value > 35 ? C.red : value > 20 ? C.yellow : C.emerald} />
                ))}
              </div>
            </section>

            <section style={{ ...card, padding: 18 }}>
              <div className="vd-card-head">
                <div>
                  <div style={kicker}>Workload Queue</div>
                  <h2>Workloads VIRIDIS can defer</h2>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {workloads.map((job) => (
                  <div key={job.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${C.divider}` }}>
                    <div>
                      <div style={{ color: '#f8fafc', fontWeight: 500 }}>{job.name}</div>
                      <div style={{ color: C.dim, fontFamily: mono, fontSize: 10, marginTop: 3 }}>{job.load}</div>
                    </div>
                    <Pill tone={job.tone}>{mitigation && job.state === 'Shiftable' ? 'Queued' : job.state}</Pill>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...card, padding: 18, background: 'linear-gradient(145deg,#0d1524 0%,#0b1724 55%,#0a201d 100%)' }}>
              <div className="vd-card-head">
                <div>
                  <div style={kicker}>Automated Mitigation</div>
                  <h2>Recommended grid relief action</h2>
                </div>
                <Pill tone={riskTone}>{peakerRisk}</Pill>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
                  <div style={{ padding: 14, border: `1px solid ${C.divider}`, borderRadius: 12, background: 'rgba(10,18,32,.72)' }}>
                    <div style={kicker}>Recommended Action</div>
                    <div style={{ marginTop: 10, fontSize: 19, lineHeight: 1.18, fontWeight: 650, color: '#f8fafc' }}>
                      Defer AI training workloads
                    </div>
                    <div style={{ marginTop: 10, display: 'grid', gap: 7, color: C.muted, fontFamily: mono, fontSize: 10 }}>
                      <span>Window: 23:00-05:00</span>
                      <span>Load: 32 MW shiftable</span>
                      <span>Facility: {model.label}</span>
                    </div>
                  </div>
                  <div style={{ padding: 14, border: `1px solid ${C.divider}`, borderRadius: 12, background: 'rgba(10,18,32,.72)' }}>
                    <div style={kicker}>Expected Impact</div>
                    <div style={{ display: 'grid', gap: 10, marginTop: 11 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                        <span style={{ color: C.muted }}>Grid stress</span>
                        <span style={{ fontFamily: mono, color: '#f8fafc' }}><span style={{ color: C.red }}>{rawStress}</span> -&gt; <span style={{ color: C.emerald }}>{mitigated[hour]}</span></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                        <span style={{ color: C.muted }}>Water avoided</span>
                        <span style={{ fontFamily: mono, color: C.cyan }}>{recommendedWaterReduction.toLocaleString()} gal/hr</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                        <span style={{ color: C.muted }}>Risk state</span>
                        <span style={{ fontFamily: mono }}><span style={{ color: riskTone }}>{peakerRisk}</span> -&gt; <span style={{ color: projectedRiskTone }}>{projectedRisk}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
                <button className={`vd-action ${mitigation ? '' : 'off'}`} type="button" onClick={() => setMitigation((value) => !value)}>
                  {mitigation ? 'Load Deferred' : 'Defer Load'}
                </button>
              </div>
            </section>
          </div>

          <CoreLogger key={model.node} facility={model} mitigation={mitigation} />
        </main>
      </div>
    </div>
  );
}
