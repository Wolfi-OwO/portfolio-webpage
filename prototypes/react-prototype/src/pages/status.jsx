import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { INCIDENTS, SERVICES } from '../data/status.js';
import { useApp } from '../store.jsx';

const Mode = () => {
  const { theme, setTheme } = useApp();
  return <button className="st-mode" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Switch light and dark" data-tip="Light / dark"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{theme === 'dark' ? <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></> : <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />}</svg></button>;
};

// Ranges as on the live page. Only 90 days of daily data exist, so the long ranges show all of it.
const RANGES = [['current', 'Current', 90], ['24h', '24h', 1], ['7d', '7d', 7], ['30d', '30d', 30], ['90d', '90d', 90], ['1y', '1y', 90], ['all', 'Whole period', 90]];
const NOW = new Date('2026-10-04T12:00:00');
const fmtDay = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const pct = (days) => {
  const seen = days.filter((d) => d[1] !== 'none');
  if (!seen.length) return null;
  return 100 - (seen.reduce((a, d) => a + d[2], 0) / (seen.length * 1440)) * 100;
};
const fmtPct = (v) => (v == null ? '–' : v >= 99.995 ? '100%' : v.toFixed(2).replace(/0$/, '') + '%');
// 24h view: 24 hourly buckets. The daily data only knows minutes per day, so each day's downtime
// is placed on a fixed hour (derived from the date) and capped at 60 min per hour.
const hourly = (s) => {
  const out = [];
  for (let h = 23; h >= 0; h--) {
    const t = new Date(NOW.getTime() - h * 3600e3), iso = t.toISOString().slice(0, 10), day = s.days.find((d) => d[0] === iso);
    const hr = t.getHours(), seed = (+iso.slice(8) * 7 + s.ms) % 24;
    const mins = day && day[2] && hr === seed ? Math.min(60, day[2]) : 0;
    const st = !day || day[1] === 'none' ? 'none' : mins >= 3 ? 'minor' : 'ok';
    const lbl = t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/:\d\d/, ':00');
    out.push([iso + '#' + hr, st, mins, lbl]);
  }
  return out;
};
const tipOf = (d) => {
  if (d[3]) return `${d[3]}: ${{ none: 'No data', ok: 'Operational', minor: 'Minor outage' }[d[1]]}${d[2] ? `, ${d[2]} mins down` : ''}`;
  const label = { none: 'No data', ok: 'Operational', minor: 'Minor outage' }[d[1]];
  return `${fmtDay(d[0])}: ${label}${d[2] ? `, ${d[2]} min${d[2] === 1 ? '' : 's'} down` : ''}`;
};

const Op = () => <span className="st-op"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.6 2.6L16 9.6" /></svg>Operational</span>;
const Pc = ({ v }) => <b className={v != null && v >= 99.85 ? 'g' : 'a'}>{v == null ? '–' : v >= 99.95 ? '100%' : v.toFixed(1) + '%'}</b>;

function Bars({ days }) {
  return (
    <div className="st-bars" role="img" aria-label={`${days.length} day history`}>
      {days.map((d) => <i key={d[0]} className={`s-${d[1]}`} data-tip={tipOf(d)} />)}
    </div>
  );
}

export function StatusPage() {
  const [q, setQ] = useSearchParams();
  const [tick, setTick] = useState(0);
  const from = q.get('from') || '', to = q.get('to') || '';
  const custom = !!(from || to);
  const [draft, setDraft] = useState({ from, to });
  const [open, setOpen] = useState(custom);
  const key = custom ? 'custom' : q.get('r') || 'current';
  const n = (RANGES.find((r) => r[0] === key) || RANGES[0])[2];

  const view = useMemo(() => SERVICES.map((s) => {
    const days = custom ? s.days.filter((d) => (!from || d[0] >= from) && (!to || d[0] <= to)) : key === '24h' ? hourly(s) : s.days.slice(-n);
    return { ...s, view: days, up: pct(days), p30: pct(s.days.slice(-30)), p7: pct(s.days.slice(-7)), p1: pct(s.days.slice(-1)) };
  }), [n, custom, from, to]);

  const groups = [...new Set(view.map((s) => s.group))];
  const avg = (k) => { const v = view.map((s) => s[k]).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const lat = view.map((s) => s.ms).sort((a, b) => a - b);
  const pick = (r) => { const nq = new URLSearchParams(); if (r !== 'current') nq.set('r', r); setQ(nq); setOpen(false); };
  const apply = () => { const nq = new URLSearchParams(); if (draft.from) nq.set('from', draft.from); if (draft.to) nq.set('to', draft.to); setQ(nq); };

  return (
    <div className="st">
      <header className="st-top">
        <div><span className="st-name">Woofi Developments</span><h1>System status</h1></div>
        <nav><Link to="/status/incidents">Incident history</Link><Mode />
          <button onClick={() => setTick((t) => t + 1)} aria-label="Refresh" data-tip="Check again now"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg></button></nav>
      </header>

      <div className="st-banner"><b><i />All systems operational</b><span>{custom ? 'Custom range' : key === '24h' ? 'Last 24 hours, hourly' : key === 'current' ? 'Last 3 months' : RANGES.find((r) => r[0] === key)[1]} · Checks run every 60 seconds · last {tick ? 'just now' : '12 s ago'}</span></div>

      <div className="st-range">
        {RANGES.map(([k, l]) => <button key={k} className={!custom && key === k ? 'on' : ''} onClick={() => pick(k)}>{l}</button>)}
        <button className={custom || open ? 'on' : ''} onClick={() => setOpen((o) => !o)}>Custom…</button>
      </div>
      {open && (
        <div className="st-custom">
          <label>From<input type="date" value={draft.from} max="2026-10-04" onChange={(e) => setDraft({ ...draft, from: e.target.value })} /></label>
          <label>To<input type="date" value={draft.to} max="2026-10-04" onChange={(e) => setDraft({ ...draft, to: e.target.value })} /></label>
          <button onClick={apply}>Apply</button>
        </div>
      )}

      <dl className="st-stats">
        <div><dt>Services up</dt><dd>{view.length}<small> / {view.length}</small></dd></div>
        <div><dt>Avg uptime · {custom ? 'selected' : '30d'}</dt><dd>{fmtPct(avg(custom ? 'up' : 'p30'))}</dd></div>
        <div><dt>Latency · p50</dt><dd>{lat[Math.floor(lat.length / 2)]}<small> ms</small></dd><dd className="sub">worst p95 550 ms</dd></div>
      </dl>

      <div className="st-mh"><h2>Monitored services</h2>
        <p className="st-legend"><span><i className="s-ok" />operational</span><span><i className="s-minor" />minor ≥0.5%</span><span><i className="s-major" />major ≥5%</span><span><i className="s-critical" />critical ≥20%</span><span><i className="s-none" />no data</span></p></div>

      {groups.map((g) => {
        const rows = view.filter((s) => s.group === g);
        const gAvg = (k) => { const v = rows.map((s) => s[k]).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
        return (
          <section className="st-group" key={g}>
            <div className="st-gh"><span className="st-dot" /><h2>{g}</h2><span className="st-count">{rows.length} services</span><Op /></div>
            <p className="st-avgs"><Pc v={gAvg('p30')} /> · 30d avg <Pc v={gAvg('p7')} /> · 7d avg <Pc v={gAvg('p1')} /> · 24h avg</p>
            <div className="st-list">
              {rows.map((s) => (
                <div className="st-row" key={s.name}>
                  <span className="st-dot sm" />
                  <div className="st-rh"><div><b>{s.name}</b><a href={'https://' + s.url} target="_blank" rel="noreferrer">{s.url}</a></div><span className="st-ms">{s.ms}ms</span><Op /></div>
                  <Bars days={s.view} />
                  <div className="st-rf"><span><Pc v={s.p30} /> · 30d <Pc v={s.p7} /> · 7d <Pc v={s.p1} /> · 24h</span>
                    <span className="st-chk"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>checked {(s.ms % 50) + 5}s ago</span></div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <footer className="st-foot">
        <span>Uptime is the share of a day the service answered; a day with data counts fully, “No data” days are ignored.</span>
        <a href="/">← Back to Woofi Developments</a>
      </footer>
    </div>
  );
}

export function IncidentsPage() {
  const days = useMemo(() => {
    const m = new Map();
    INCIDENTS.forEach((i) => m.set(i.day, [...(m.get(i.day) || []), i]));
    return [...m];
  }, []);
  return (
    <div className="st">
      <header className="st-top">
        <div><span className="st-name">Woofi Developments</span><h1>Incident history</h1></div>
        <nav><Link to="/status">← Status</Link><Mode /></nav>
      </header>
      <p className="st-sum">{INCIDENTS.length} incidents in the last 90 days, all minor outages.</p>
      {days.map(([day, list]) => (
        <section className="st-group" key={day}>
          <div className="st-gh"><h2>{day}</h2><span>{list.length} incident{list.length === 1 ? '' : 's'}</span></div>
          {list.map((i, k) => (
            <div className="st-inc" key={k}>
              <b>{i.svc}</b><span className="st-tag">Minor outage</span>
              <span className="mono">{i.from} → {i.to}</span><span className="mono">{i.mins} min{i.mins === 1 ? '' : 's'}</span>
            </div>
          ))}
        </section>
      ))}
      <footer className="st-foot"><span /><a href="/">← Back to Woofi Developments</a></footer>
    </div>
  );
}
