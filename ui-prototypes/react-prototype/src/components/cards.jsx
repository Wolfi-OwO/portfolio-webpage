import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../store.jsx';
import { C, heat } from '../data/content.js';
import { Ctl, Icon, Row, Tag } from './blocks.jsx';
import { TECH_ICON } from '../lib/techIcons.js';

// ---------- projects ----------
export function ProjCard({ p, idx }) {
  return (
    <Row kind="project" idx={idx} as="article" className="card proj" name={p.t}>
      <Ctl kind="project" idx={idx} />
      <div className={`shot ${p.shot ? '' : 'ph2'}`}>
        <div className="chrome"><i /><i /><i /><span>{p.live || 'repository only'}</span></div>
        {p.shot ? <img src={p.shot} alt={`Screenshot of ${p.t}`} loading="lazy" /> : <div className="ph2-body"><b>{p.t.split(' ').map((w) => w[0]).join('').slice(0, 3)}</b></div>}
      </div>
      <h3>{p.t}</h3><p>{p.d}</p>
      <div className="tags">{p.tech.map((t) => <Tag key={t}>{t}</Tag>)}</div>
      <div className="links">
        {p.live && <a className="btn sm" href="/projects">Live demo <span>↗</span></a>}
        <a className="btn sm ghost" href="/projects">Repository <span>↗</span></a>
      </div>
    </Row>
  );
}

// ---------- career ----------
export function CareerRow({ e, idx }) {
  return (
    <Row kind="career" idx={idx} className={`crow k-${e.k}`} name={e.t}>
      <Ctl kind="career" idx={idx} />
      <span className="mono muted when">{e.from} — {e.to}</span>
      <div><b>{e.t}</b><span className="org">{e.o}{e.loc ? ' · ' + e.loc : ''}</span>{e.d && <p>{e.d}</p>}{e.tags?.length > 0 && <div className="tags">{e.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>}</div>
    </Row>
  );
}

// ---------- availability ----------
export function Availability() {
  const { data } = useApp();
  return (
    <div className="card avail">
      <h3>Availability</h3><p className="lead">{C.availability.intro}</p>
      <ol className="tl">
        {data.timeline.map((e, i) => (
          <Row key={e.t + i} kind="timeline" idx={i} as="li" className={`${e.state} k-${e.k}`} name={e.t}>
            <Ctl kind="timeline" idx={i} /><span className="dot" />
            <div><b>{e.t}</b><span className="mono muted">{e.from} → {e.to}</span><p>{e.d}</p></div>
          </Row>
        ))}
      </ol>
      <a className="btn ghost" href="/services">What I build and what it costs →</a>
    </div>
  );
}

// ---------- activity heatmap: same behaviour as components/activity-heatmap.jsx ----------
const HW = 156, TODAY = new Date('2026-10-04T12:00:00');
function makeDays() {
  let s = 11; const r = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; const out = [];
  for (let w = 0; w < HW; w++) for (let d = 0; d < 7; d++) {
    const date = new Date(TODAY); date.setDate(TODAY.getDate() - ((HW - 1 - w) * 7 + (6 - d)));
    if (date > TODAY) { out.push(null); continue; }
    const busy = (d > 0 && d < 6 ? 0.66 : 0.3) * (0.35 + 0.65 * Math.sin(w / 6) ** 2 + 0.15);
    out.push({ date, gh: r() < busy ? Math.ceil(r() * r() * 9) : 0, gl: r() < busy * 0.35 ? Math.ceil(r() * 5) : 0 });
  }
  return out;
}
const fmtD = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const lvl = (n) => (n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4);

export function Heatmap() {
  const days = useMemo(makeDays, []);
  const [src, setSrc] = useState('all');
  const [atStart, setAtStart] = useState(false);
  const sc = useRef(null);
  useEffect(() => { sc.current.scrollLeft = sc.current.scrollWidth; }, []);
  const cnt = (c) => (src === 'all' ? c.gh + c.gl : src === 'github' ? c.gh : c.gl);
  const totals = useMemo(() => days.reduce((a, c) => (c ? { all: a.all + cnt(c), gh: a.gh + c.gh, gl: a.gl + c.gl } : a), { all: 0, gh: 0, gl: 0 }), [days, src]); // eslint-disable-line react-hooks/exhaustive-deps
  const months = []; let last = -1;
  for (let w = 0; w < HW; w++) { const d = days[w * 7].date; if (d.getMonth() !== last && d.getDate() <= 7) { last = d.getMonth(); months.push([w, d.toLocaleDateString('en-GB', { month: 'short' }) + (d.getMonth() === 0 ? " '" + String(d.getFullYear()).slice(2) : '')]); } }
  return (
    <div className="card heat in" id="heat">
      <div className="heat-top"><h3>What I'm building right now</h3><span className="mono muted">{totals.all.toLocaleString('en-GB')} contributions since {days[0].date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span></div>
      <div className="seg">{[['all', 'All'], ['github', 'GitHub'], ['gitlab', 'GitLab']].map(([k, l]) => <button key={k} className={src === k ? 'on' : ''} onClick={() => setSrc(k)}>{l}</button>)}</div>
      <div className="heat-scroll" ref={sc} onScroll={(e) => setAtStart(e.currentTarget.scrollLeft < 24)}>
        <div className="heat-inner">
          <div className="heat-months mono">{months.map(([w, m]) => <span key={w} style={{ gridColumn: `${w + 1} / span 3` }}>{m}</span>)}</div>
          <div className="heat-grid go">
            {days.map((c, n) => {
              if (!c) return <i key={n} style={{ visibility: 'hidden' }} />;
              const k = cnt(c);
              return <i key={n} className={`l${lvl(k)}`} tabIndex={k ? 0 : -1} style={{ '--i': HW - 1 - Math.floor(n / 7) }} aria-label={`${k} · ${c.date.toISOString().slice(0, 10)}`}
                data-tip={`${k} contribution${k === 1 ? '' : 's'}`} data-tip-sub={fmtD(c.date)} data-tip-meta={k ? [c.gh && 'GitHub ' + c.gh, c.gl && 'GitLab ' + c.gl].filter(Boolean).join(' · ') : 'no activity'} />;
            })}
          </div>
        </div>
      </div>
      <div className="heat-foot mono muted"><span>{atStart ? 'Start of history' : '← scroll for earlier years'}</span><span>less <i className="l0" /><i className="l1" /><i className="l2" /><i className="l3" /><i className="l4" /> more</span></div>
      <div className="srcs">
        <a className="src" href="/projects"><b>GitHub</b><span className="mono muted">{totals.gh} contributions</span><em className="live-dot" /></a>
        <a className="src" href="/projects"><b>GitLab</b><span className="mono muted">{totals.gl} contributions</span><em className="live-dot" /></a>
      </div>
      <div className="recent"><span className="mono muted">Recently touched</span>{['portfolio-webpage', 'network-visualizer', 'metrion'].map((r) => <a key={r} href="/projects">{r}</a>)}</div>
    </div>
  );
}

// near-black brand colours (Express, Next...) would vanish on dark; those use the text colour instead
const dark = (hex) => { const n = parseInt(hex, 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) < 70; };
export const TechGrid = () => (
  <div className="techs">{C.tech.map((t) => {
    const ic = TECH_ICON[t];
    return <div className="tech" key={t}>{ic ? <svg className="tico" viewBox="0 0 24 24" aria-hidden="true" fill={dark(ic.hex) ? 'currentColor' : '#' + ic.hex}><path d={ic.path} /></svg> : <i className="sw" />}{t}</div>;
  })}</div>
);

// ---------- services ----------
const SVC_IC = { Web: 'globe', Mobile: 'phone', Desktop: 'monitor', Other: 'tool' };
export function ServiceCard({ s, idx }) {
  const m = s.price.match(/^from (.+)$/), big = m ? m[1] : s.price.charAt(0).toUpperCase() + s.price.slice(1);
  return (
    <Row kind="service" idx={idx} as="article" className="card svc2" name={s.t}>
      <span className="svc-ico"><Icon n={SVC_IC[s.cat] || 'tool'} size={24} sw={1.9} /></span>
      <Ctl kind="service" idx={idx} />
      <span className="pill">{s.cat}</span><h3>{s.t}</h3><p className="svc-d">{s.d}</p>
      {s.del.length > 0 && <ul className="checks">{s.del.map((d) => <li key={d}><Icon n="check" size={16} sw={2.6} /><span>{d}</span></li>)}</ul>}
      <div className="svc-foot"><div className="price2"><small className="mono">{m ? 'starting at' : 'price'}</small><b>{big}</b></div><div className="svc-chips"><span className="metachip">{s.rate}</span>{s.dur && <span className="metachip">{s.dur}</span>}</div></div>
      <a className="btn sm" href="/contact">Ask about this <span>→</span></a>
    </Row>
  );
}

// ---------- personal ----------
export function HobbyCard({ h, idx }) {
  return (
    <Row kind="hobby" idx={idx} as="article" className="card hobby" name={h.t} style={{ '--i': idx }}>
      <Ctl kind="hobby" idx={idx} />
      <span className="hico"><Icon n={h.icon} size={26} sw={1.9} /></span><h3>{h.t}</h3>
      {h.tags.length > 0 && <div className="tags">{h.tags.map((t) => <Tag key={t}>{t}</Tag>)}</div>}
    </Row>
  );
}

// generated cover art, or the YouTube thumbnail when the track has a video id
export function Cover({ m, cls, children }) {
  return (
    <span className={`cover ${cls}`} style={{ '--h1': m.h[0], '--h2': m.h[1] }}>
      {m.vid ? <img className="yt" src={`https://i.ytimg.com/vi/${m.vid}/hqdefault.jpg`} alt="" /> : <Icon n="note" size={cls === 'big' ? 56 : cls === 'sm' ? 20 : 28} sw={1.8} />}
      {children}
    </span>
  );
}
