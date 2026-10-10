import { useState } from 'react';
import { useApp } from '../store.jsx';
import { C } from '../data/content.js';
import { AddBtn, Icon, SecLabel } from '../components/blocks.jsx';
import CareerChart from '../components/career-chart.jsx';
import { Availability, CareerRow, Heatmap, ProjCard, ServiceCard, TechGrid } from '../components/cards.jsx';
import { Avatar } from './personal.jsx';
import LoadingScreen, { shouldBoot } from '../components/LoadingScreen.jsx';

const Badge = () => <span className="badge"><i />{C.availability.badge}</span>;
const Lines = ({ lines }) => <h1>{lines.map((l, i) => <span className="ln" key={i}><span style={{ '--d': `${i * 110}ms` }}>{l}</span></span>)}</h1>;

export function Home() {
  const { data } = useApp();
  const [booting, setBooting] = useState(shouldBoot);
  const feat = [2, 0, 3].filter((i) => data.projects[i]);
  return (
    <>
      {booting && <LoadingScreen onDone={() => setBooting(false)} />}
      <section className="hero">
        <div className="hero-top mono muted"><span>Portfolio · Carinthia, AT</span><span className="hb"><Badge /></span></div>
        <Lines lines={[<>Hi, I'm <em>Wolfi</em>.</>, 'I make software that', 'does what it says.']} />
        <div className="hero-row">
          <img className="portrait" src="/assets/profile-image.jpg" alt="Wolfi, portrait" />
          <div>
            <p className="lead big">{C.role}.</p><p className="lead">{C.bio}</p>
            <div className="btns"><a className="btn" href="/contact">Start a conversation</a><a className="btn ghost" href="/projects">Read the work →</a></div>
          </div>
        </div>
      </section>
      <section><SecLabel n="01" kind="project">Selected work</SecLabel>
        <div className="grid3">{feat.map((i) => <ProjCard key={i} p={data.projects[i]} idx={i} />)}</div>
        <a className="btn ghost more" href="/projects">All {data.projects.length} projects →</a></section>
      <section><SecLabel n="02" kind="career">Where I've been</SecLabel>
        <div className="mini-career">{data.career.slice(0, 3).map((e, i) => <CareerRow key={e.t + i} e={e} idx={i} />)}</div>
        <a className="btn ghost more" href="/career">Full career & education →</a></section>
      <section><SecLabel n="03" kind="timeline">Availability</SecLabel><Availability /></section>
      <section><SecLabel n="04">Activity</SecLabel><Heatmap /></section>
      <section><SecLabel n="05">Technologies I use</SecLabel><TechGrid /></section>
      <section><SecLabel n="06">Beyond the code</SecLabel>
        <a className="card teaser" href="/personal"><Avatar size="sm" /><div><h3>The person behind the code</h3><p className="muted">My sona, art, music and the things I love outside of work.</p></div><span className="btn sm ghost">Meet me →</span></a></section>
      <section className="cta-band"><h2>Not sure what you need?</h2><p>Describe what should happen and I'll tell you what it takes to build it, even if it isn't worth it.</p><a className="btn" href="/contact">Start a conversation</a></section>
    </>
  );
}

export function Projects() {
  const { data } = useApp();
  const [f, setF] = useState('All');
  const shown = data.projects.map((p, idx) => ({ p, idx })).filter(({ p }) => f === 'All' || p.tech.includes(f) || p.tech.includes(f + 'Js'));
  return (
    <>
      <header className="page-h"><span className="kicker mono">Projects</span><h1>Things I've <em>shipped</em></h1>
        <p className="lead">{data.projects.length} projects, from teaching tools to infrastructure. Filter by stack.</p>
        <div className="chips">{['All', 'React', 'TypeScript', 'Express', 'Python', 'Docker'].map((c) => <button key={c} className={f === c ? 'on' : ''} onClick={() => setF(c)}>{c}</button>)}</div>
        <AddBtn kind="project" label="New project" /></header>
      <div className="grid2">{shown.map(({ p, idx }) => <ProjCard key={p.t + idx} p={p} idx={idx} />)}</div>
      {shown.length === 0 && <p className="muted">Nothing with {f} yet.</p>}
    </>
  );
}

export function Career() {
  const { data } = useApp();
  return (
    <>
      <header className="page-h"><span className="kicker mono">Career & education</span><h1>A short, <em>honest</em> CV</h1></header>
      <CareerChart entries={data.careerChart} />
    </>
  );
}

const STEPS = [['chat', 'Tell me what should happen', 'A few lines are enough. Rough ideas are fine.'], ['compass', 'I tell you what it takes', 'Even if the honest answer is that it is not worth building.'], ['flag', 'We start', 'Smaller jobs in between, bigger projects from April 2027.']];
export function Services() {
  const { data } = useApp();
  return (
    <>
      <header className="page-h"><span className="kicker mono">What I build</span><h1>Services, <em>priced</em> plainly</h1>
        <p className="lead">{C.servicesIntro}</p>
        <div className="svc-meta"><span className="metachip big">Hourly rate €30</span><span className="metachip big live"><i />Small jobs now · larger projects from April 2027</span></div>
        <AddBtn kind="service" label="New service" /></header>
      <div className="svc-grid">{data.services.map((s, i) => <ServiceCard key={s.t + i} s={s} idx={i} />)}</div>
      <section><h2 className="sec-label">How it works</h2>
        <div className="steps">{STEPS.flatMap(([ic, t, d], i) => [
          i > 0 && <span className="step-arr" aria-hidden="true" key={'a' + i}>→</span>,
          <div className="card step" key={t}><span className="step-ico"><Icon n={ic} size={22} sw={1.9} /></span><b>{t}</b><p className="muted">{d}</p></div>,
        ])}</div></section>
      <section className="cta-band"><h2>Not sure which of these you need?</h2><p>Describe what should happen and I'll tell you what it takes, even if it isn't worth it.</p><a className="btn" href="/contact">Get in touch</a></section>
    </>
  );
}

export function Contact() {
  const { toast } = useApp();
  const [sent, setSent] = useState(false);
  const copy = (v) => (navigator.clipboard?.writeText(v) || Promise.reject()).then(() => toast('Copied to clipboard.')).catch(() => toast(v));
  return (
    <>
      <header className="page-h"><span className="kicker mono">Contact</span><h1>Let's talk.</h1><p className="lead">{C.contactIntro}</p></header>
      <div className="split">
        <div className="chan">
          {C.contact.map((c) => (
            <a key={c.k} className="card ch" href={c.k === 'Email' ? 'mailto:' + c.v : c.k === 'Telegram' ? 'https://t.me/' + c.v.slice(1) : '/contact'} target={c.k === 'Telegram' ? '_blank' : undefined} rel="noreferrer"
              onClick={(e) => { if (c.k === 'Discord' || c.k === 'Barq') { e.preventDefault(); copy(c.v); } }}>
              <span className="mono muted">{c.k}</span><b>{c.v}</b><p>{c.n}</p>
            </a>
          ))}
          <dl className="facts"><div><dt>Reply time</dt><dd>1–2 days</dd></div><div><dt>Location</dt><dd>Villach, Carinthia</dd></div><div><dt>Availability</dt><dd>{C.availability.badge}</dd></div></dl>
        </div>
        <form className="card form" onSubmit={(e) => { e.preventDefault(); setSent(true); toast('Message sent.'); e.target.reset(); }}>
          <h3>Or write here</h3>
          <label>Name<input required placeholder="Your name" /></label><label>Email<input required type="email" placeholder="you@example.com" /></label>
          <label>Subject<input required placeholder="What's it about?" /></label><label>Message<textarea required rows={5} placeholder="Describe what should happen…" /></label>
          <p className="muted small">Stored only in my database, visible only to me, deleted after 90 days at the latest.</p>
          <button className="btn">Send message</button>{sent && <p className="ok">Message sent. I'll reply within a day or two.</p>}
        </form>
      </div>
    </>
  );
}
