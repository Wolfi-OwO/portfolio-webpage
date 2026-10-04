import { useEffect, useState } from 'react';
import { useApp } from '../store.jsx';
import { C } from '../data/content.js';
import { Icon } from '../components/blocks.jsx';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

// ---------- status ----------
function Count({ to, dec = 0, suffix = '' }) {
  const [v, setV] = useState(0);
  useEffect(() => { let n = 0; const id = setInterval(() => { n++; setV(to * (1 - (1 - n / 24) ** 3)); if (n >= 24) clearInterval(id); }, 38); return () => clearInterval(id); }, [to]);
  return <b>{v.toFixed(dec)}{suffix}</b>;
}
export function Status() {
  const [range, setRange] = useState('30 d');
  const allOk = C.status.every((s) => s.ok);
  return (
    <>
      <header className="page-h"><span className="kicker mono">Status</span><h1>Everything <em>running</em>?</h1>
        <div className={`statusbar ${allOk ? '' : 'warn'}`}><i /><b>{allOk ? 'All systems operational' : 'One service had a hiccup'}</b><span className="mono muted">updated 12 s ago · via Metrion</span></div>
        <div className="seg">{['Live', '24 h', '7 d', '30 d', '90 d', '1 y', 'All', 'Custom…'].map((r) => <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>{r}</button>)}</div></header>
      <div className="stats">
        <div className="card stat"><span className="mono muted">Avg uptime · {range}</span><Count to={99.55} dec={2} suffix="%" /></div>
        <div className="card stat"><span className="mono muted">Latency · p50 ({range})</span><Count to={240} suffix=" ms" /></div>
        <div className="card stat"><span className="mono muted">Incidents</span><Count to={3} /></div>
      </div>
      <div className="card svc-list">{C.status.map((s) => (
        <div className={`srow ${s.ok ? '' : 'down'}`} key={s.n}><div className="sname"><i /><b>{s.n}</b><span className="mono muted">{s.up}% · {s.ms} ms</span></div>
          <div className="ubars">{Array.from({ length: 60 }, (_, i) => { const bad = !s.ok && i > 52 && i % 3; return <i key={i} className={bad ? 'bad' : ''} data-tip={bad ? 'Down' : '100% up'} data-tip-sub={59 - i === 0 ? 'Today' : `${59 - i} days ago`} />; })}</div></div>))}</div>
      <div className="card inc"><h3>Incidents in this period</h3>
        <p><b>Preussen Web</b> <span className="mono muted">2 Oct 2026 · 14 min</span></p><p><b>Machine Learning Visualizer</b> <span className="mono muted">19 Sep 2026 · 6 min</span></p>
        <a className="btn ghost" href="/status">view the full incident history →</a></div>
      <p className="muted small">Status data combines this site's own checks with uptime pulled from Metrion.</p>
    </>
  );
}

// ---------- legal ----------
export const Privacy = () => (
  <>
    <header className="page-h"><span className="kicker mono">Legal</span><h1>Privacy policy</h1><p className="mono muted">Last updated: 21 Sep 2026</p><p className="lead">{C.privacyIntro}</p></header>
    <div className="prose card"><h3>The short version</h3><p>{C.privacyShort}</p><h3>Server logs</h3><p>Caddy writes one log line per request. Before it is written, your IP address, path, query string and all headers are stripped.</p>
      <h3>Fonts</h3><p>Manrope and JetBrains Mono are served from my own server, with no connection to Google Fonts.</p><h3>Your rights</h3><p>Access, correction, deletion, restriction, portability, objection. Write to me; I reply within a month.</p></div>
  </>
);
export const Imprint = () => (
  <>
    <header className="page-h"><span className="kicker mono">Legal</span><h1>Imprint</h1></header>
    <div className="prose card"><p>Information pursuant to §5 ECG and §25 MedienG:</p><p><b>{C.imprint}</b></p><p>Scope: software development, web development and digital solutions.</p><a className="btn ghost" href="/privacy">To the privacy policy →</a></div>
  </>
);
export const NotFound = () => (
  <div className="center"><div className="narrow"><span className="kicker mono">404</span><h1>Page not <em>found</em>.</h1><p className="lead">That address doesn't exist (anymore).</p><a className="btn" href="/">Back to start</a></div></div>
);

// ---------- admin ----------
const EyeBtn = ({ target }) => <button type="button" className="eye" aria-label="Show password" onClick={() => { const i = document.getElementById(target); i.type = i.type === 'password' ? 'text' : 'password'; }}><Icon n="eye" /></button>;

export function Login() {
  const { login, toast } = useApp();
  const navigate = useNavigate();
  return (
    <div className="center"><form className="card form narrow" onSubmit={(e) => { e.preventDefault(); login(); navigate('/'); setTimeout(() => toast('Signed in. Pencils appear on every entry.'), 200); }}>
      <span className="kicker mono">Admin</span><h1 className="h2">Sign in</h1><p className="muted small">Only I use this, to maintain the content of the site.</p>
      <label>Username<input placeholder="admin" autoComplete="off" /></label>
      <label>Password<span className="pw"><input id="pw" type="password" placeholder="••••••••" /><EyeBtn target="pw" /></span></label>
      <button className="btn">Sign in</button><a className="muted small" href="/">← back to the site</a></form></div>
  );
}

const Conf = ({ c }) => <span className={`conf ${c.toLowerCase()}`}>{c} confidence</span>;
const level = (n) => (n < 20 ? ['Mostly human-written', 'ok'] : n < 60 ? ['Mixed', 'mid'] : ['Mostly AI-written', 'hi']);
const CODE = [['client/src (React)', 41, 'Low'], ['server/src (Express)', 33, 'Low'], ['jobs/ (Azure Functions)', 28, 'Low'], ['docs/ and README', 52, 'Medium']];

export function Admin() {
  const { auth, toast } = useApp();
  const [params] = useSearchParams();
  const initial = params.get('tab');
  const [tab, setTab] = useState(initial || 'overview');
  const [msgs, setMsgs] = useState(C.messages);
  const [open, setOpen] = useState(0);
  const [checking, setChecking] = useState(false);
  useEffect(() => { if (initial) setTab(initial); }, [initial]);
  if (!auth) return <Login />;
  const TABS = [['overview', 'Overview'], ['ai', 'AI check'], ['messages', 'Messages'], ['monitors', 'Monitors']];
  const unread = msgs.filter((m) => m.unread).length;
  const m = msgs[open];
  return (
    <>
      <header className="page-h"><span className="kicker mono">Admin</span><h1>Inbox &amp; checks</h1></header>
      <div className="adm">
        <aside className="adm-nav">{TABS.map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}{k === 'messages' && unread > 0 && <em>{unread}</em>}</button>)}<a href="/" className="adm-out" onClick={() => { sessionStorage.removeItem('adm'); location.assign('/'); }}>Sign out</a></aside>
        <div className="adm-body">
          {tab === 'overview' && <>
            <div className="stats"><div className="card stat"><span className="mono muted">Unread messages</span><b>{unread}</b></div><div className="card stat"><span className="mono muted">Monitors</span><b>{C.monitors.length}</b></div><div className="card stat"><span className="mono muted">AI score (text)</span><b>{C.ai.score}%</b></div></div>
            <div className="card"><h3>Edit content right on the page</h3><p className="muted">Career, availability, services, projects, the gallery, music and hobbies are edited where they appear: use the pencil and trash buttons on any entry, or “New entry” in the section heading.</p>
              <div className="btns"><a className="btn sm" href="/">Home</a>{[['career', 'Career'], ['services', 'Services'], ['projects', 'Projects'], ['personal', 'Personal']].map(([h, l]) => <a key={h} className="btn sm ghost" href={'#/' + h}>{l}</a>)}</div></div></>}
          {tab === 'ai' && <>
            <div className="adm-h"><h3>AI check</h3><span className="mono muted small"><i className="pub on" /> private, only you see this</span></div>
            <div className="card"><div className="ai-top"><div className={`gauge big ${level(C.ai.score)[1]}`} style={{ '--v': C.ai.score }}><b>{C.ai.score}%</b><span className="mono small">text, whole site</span></div>
              <div><p className="muted">How likely the visible text of this site is machine-written, averaged over all pages. <Conf c="High" /></p>
                <div className="btns"><button className="btn sm" disabled={checking} onClick={() => { setChecking(true); setTimeout(() => { setChecking(false); toast('Check finished. Scores unchanged.'); }, 1500); }}>{checking ? 'Checking…' : 'Run check now'}</button><span className="mono muted small">last run {C.ai.checked}</span></div></div></div></div>
            <div className="card"><h3>Text, per page</h3><div className="ai-pages">{C.ai.pages.map(([n, v]) => <div className="aip" key={n}><span>{n}</span><span className="bar"><i className={level(v)[1]} style={{ '--w': `${Math.max(v, 2)}%` }} /></span><span className="mono small muted">{v}%</span></div>)}</div></div>
            <div className="card"><h3>Code, per area</h3><p className="muted small">Code detectors are far less reliable than text detectors. Read these as a rough hint, never as proof.</p>
              <div className="ai-pages">{CODE.map(([n, v, c]) => <div className="aip wide" key={n}><span>{n}</span><span className="bar"><i className={level(v)[1]} style={{ '--w': `${v}%` }} /></span><span className="mono small muted">{v}%</span><Conf c={c} /></div>)}</div></div>
            <div className="card"><p className="mono muted small">Sample numbers in this prototype. A real run needs a detector API key stored on the server.</p></div></>}
          {tab === 'messages' && <>
            <div className="adm-h"><h3>Contact messages</h3><span className="mono muted small">stored only here · deleted automatically after 90 days</span></div>
            {msgs.length === 0 ? <p className="muted">Inbox zero.</p> : (
              <div className="inbox"><div className="mlist">{msgs.map((x, i) => <button key={x.s} className={`mrow ${i === open ? 'on' : ''}`} onClick={() => { setOpen(i); setMsgs((l) => l.map((y, j) => (j === i ? { ...y, unread: false } : y))); }}>{x.unread ? <i className="ud" /> : <i />}<span><b>{x.n}</b><em>{x.s}</em></span><span className="mono muted">{x.d}</span></button>)}</div>
                {m && <div className="card mview"><span className="mono muted small">{m.d} · auto-delete in {m.left} days</span><h3>{m.s}</h3><p className="muted small">{m.n} &lt;{m.e}&gt;</p><p>{m.b}</p>
                  <div className="btns"><a className="btn sm" href={`mailto:${m.e}`}>Reply by email ↗</a><button className="btn sm ghost danger" onClick={() => { setMsgs((l) => l.filter((_, j) => j !== open)); setOpen(0); toast('Message deleted.'); }}>Delete now</button></div></div>}</div>)}</>}
          {tab === 'monitors' && <>
            <div className="adm-h"><h3>Monitors</h3><span className="mono muted small">checked every minute · results kept 90 days</span></div>
            <div className="tbl"><div className="tr th"><span>Name</span><span>Status</span><span>Check</span><span /><span /></div>{C.monitors.map((n, i) => <div className="tr" key={n}><span><b>{n}</b></span><span><i className={`pub ${i === 6 ? 'bad' : 'on'}`} /> {i === 6 ? 'down' : 'up'}</span><span className="mono muted">{i === 6 ? 'skip' : 'http'}</span><span /><span /></div>)}</div></>}
        </div>
      </div>
    </>
  );
}

// ---------- secret (1:1 behaviour of the real page: gate, then photo, counter, voucher) ----------
const SINCE = new Date('2025-12-25T15:37:48');
function elapsed(now = new Date()) {
  let y = now.getFullYear() - SINCE.getFullYear(), mo = now.getMonth() - SINCE.getMonth(), d = now.getDate() - SINCE.getDate(), h = now.getHours() - SINCE.getHours(), mi = now.getMinutes() - SINCE.getMinutes(), s = now.getSeconds() - SINCE.getSeconds();
  if (s < 0) { s += 60; mi--; } if (mi < 0) { mi += 60; h--; } if (h < 0) { h += 24; d--; } if (d < 0) { d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); mo--; } if (mo < 0) { mo += 12; y--; }
  return [['Jahre', y], ['Monate', mo], ['Tage', d], ['Stunden', h], ['Minuten', mi], ['Sekunden', s]];
}
export function Secret() {
  const { toast } = useApp();
  const [open, setOpen] = useState(() => sessionStorage.getItem('portfolio.secretUnlocked') === 'true');
  const [wrong, setWrong] = useState(false);
  const [units, setUnits] = useState(elapsed);
  const [dl, setDl] = useState(false);
  useEffect(() => { if (!open) return undefined; const id = setInterval(() => setUnits(elapsed()), 1000); return () => clearInterval(id); }, [open]);
  if (!open) {
    return (
      <div className="center"><form className="card form narrow" onSubmit={(e) => { e.preventDefault(); if (!e.target.pw.value.trim()) return setWrong(true); sessionStorage.setItem('portfolio.secretUnlocked', 'true'); setOpen(true); }}>
        <span className="kicker mono">Geheim</span><h1 className="h2">Du hast etwas gefunden</h1><p className="muted">Es ist aber verschlossen. Du kennst das Wort.</p>
        <label>Passwort<span className="pw"><input id="spw" name="pw" type="password" autoComplete="off" /><EyeBtn target="spw" /></span></label>
        {wrong && <p className="gerr">Nicht ganz. Versuch es nochmal.</p>}<button className="btn">Aufmachen</button><a className="muted small" href="/">Lieber doch nicht — zurück zur Startseite</a></form></div>
    );
  }
  return (
    <div className="secret">
      <div className="hearts" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 0.7) % 6}s`, fontSize: 12 + (i % 4) * 6 }}>♥</i>)}</div>
      <figure className="us"><img src="/assets/us.webp" alt="A photo of the two of us" /></figure>
      <header className="page-h center-t"><Icon n="heart" size={56} sw={0} fill="#e5675b" className="heartbeat" /><span className="kicker mono">Zusammen seit 25.12.2025, 15:37:48</span>
        <h1>Für Helmi<br /><em>(aka. die Liebe meines Lebens)</em></h1>
        <p className="lead">Manche Dinge kann man nicht bauen, egal, wie gut man darin wird. Man hat einmal Glück — und danach ist man jeden einzelnen Tag dankbar dafür. Du bist das Beste in meinem Leben: der Mensch, dem ich alles zuerst erzählen will, und der aus einem ganz gewöhnlichen Abend den Ort macht, an dem ich am liebsten bin. Danke, dass es dich gibt.</p></header>
      <div className="units">{units.map(([u, v]) => <div className="unit" key={u}><b>{v}</b><span className="mono muted">{u}</span></div>)}</div>
      <div className="card mile rose"><span className="badge"><i />Heute sind es 9 Monate</span><p>Ich hab immer gedacht, so was legt sich mit der Zeit. Tut es aber nicht. Dein Name leuchtet am Handy auf und ich freu mich, jedes Mal. Und ehrlich, die schönsten Tage waren die, an denen wir eigentlich gar nichts gemacht haben.</p></div>
      <div className="card gift"><span className="kicker mono">Ein Geschenk für dich</span>
        <div className="vrow"><img className="voucher" src="/assets/voucher.webp" alt="Virtueller Geschenkgutschein" /><div><h3>Virtueller Geschenkgutschein</h3><p className="mono muted small">Geliefert am Samstag, 25. Juli, an Helmi</p></div></div>
        <div className="note"><p>I love you so fucking much <span className="acc">♥</span></p><p>I never knew that an person like you could make my life so colorful again and give it a purpose again. I wanna live with you forever and also die together.</p><p>I never ever wanna loose you...</p></div>
        <button className="btn sm" disabled={dl} onClick={() => { setDl(true); setTimeout(() => { setDl(false); toast('Beleg heruntergeladen.'); }, 900); }}>{dl ? 'Wird geholt…' : 'Beleg herunterladen'}</button></div>
      <p className="center-t muted">…und ich zähle weiter. Ich liebe dich <span className="acc">♥</span></p>
    </div>
  );
}
