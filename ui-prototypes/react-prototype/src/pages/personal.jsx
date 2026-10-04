import { useState } from 'react';
import { useApp } from '../store.jsx';
import { C } from '../data/content.js';
import { Ctl, Icon, InlineForm, Row, SecLabel, Tag } from '../components/blocks.jsx';
import { Cover, HobbyCard } from '../components/cards.jsx';

export const Avatar = ({ size = '' }) => <div className={`avatar ${size}`}><img src="/assets/sona/icon.gif" alt="Woofi, my sona" /></div>;

const SWATCHES = [['Slate', '#5d6376'], ['Steel', '#476a7d'], ['Ice', '#96d1e1'], ['Ink', '#262626'], ['Lavender', '#d4daf0'], ['Salmon', '#e3978b']];

function FindMe() {
  const { toast } = useApp();
  const copy = (v) => (navigator.clipboard?.writeText(v) || Promise.reject()).then(() => toast('Copied to clipboard.')).catch(() => toast(v));
  const items = [['Discord', 'woofiowo', 'chat', null], ['Telegram', '@WolfiOwO', 'telegram', 'https://t.me/WolfiOwO'], ['Barq', '@Woofi', 'heart', null]];
  return (
    <div className="findme"><span className="mono muted small">Find me</span>
      {items.map(([n, v, ic, href]) => (href
        ? <a key={n} className="fm" href={href} target="_blank" rel="noreferrer" data-tip={n} data-tip-meta={v}><Icon n={ic} size={16} /><span>{v}</span></a>
        : <button key={n} className="fm" data-tip={n} data-tip-sub="Click to copy" data-tip-meta={v} onClick={() => copy(v)}><Icon n={ic} size={16} /><span>{v}</span></button>))}
    </div>
  );
}

function About() {
  const { data } = useApp();
  const [st, setSt] = useState('card');
  const [swap, setSwap] = useState(false);
  const pick = (k) => { setSwap(true); setTimeout(() => { setSt(k); setSwap(false); }, 160); };
  const row = (k, v) => <div key={k}><dt><i />{k}</dt><dd>{v}</dd></div>;
  return (
    <div className="about-wrap">
      <div className="seg about-seg" data-tip="Mockup only" data-tip-sub="Pick the description style you like">
        {[['card', 'Profile card'], ['story', 'Story'], ['home', 'Like the homepage']].map(([k, l]) => <button key={k} className={st === k ? 'on' : ''} onClick={() => pick(k)}>{l}</button>)}
      </div>
      <div className={`card about ${swap ? 'swap' : ''}`}>
        {st === 'story' && <>
          <p className="lead big2">I'm Wolfi, a wolf from Carinthia who builds software and climbs things for fun.</p>
          <p className="lead">Free time belongs to the mountains and the climbing wall, evenings to horror games, documentaries and whatever music comes next. I like knowing how things work: computers first, then rocks, then physics and chemistry.</p>
          <p className="lead">Strip all of that away and what's left is: <b>cute, silly, lazy, gay AF, beautiful, loving, smart, dumb</b>. Depending on the day, in that order or the other.</p>
          <p className="muted">Want to know more? Write me, I'm happy about every message ^w^</p></>}
        {st === 'home' && <><p className="lead">{C.bio}</p><p className="lead">Outside of work you'll find me on a mountain, on a climbing wall, or deep in a game. More about all of that right below.</p><p className="muted">Write me anytime ^w^</p></>}
        {st === 'card' && <><dl className="profile">{[row('Name', 'Wolfi'), row('Pronouns', 'he / him'), row('From', 'Carinthia, Austria'), row('Hobbies', 'Mountaineering, climbing'), row('Music', 'Everything'), row('Also into', data.favs.interests.join(', ')), row('Films', data.favs.films.join(', ')), row('Games', data.favs.games.join(', '))]}</dl>
          <p className="muted profile-f">If you want to know more about me, write me a message. I'm happy about every one ^w^</p></>}
      </div>
    </div>
  );
}

function Music() {
  const { data } = useApp();
  const np = data.music[0];
  return (
    <div className="music">
      <div className="card np">
        <Cover m={np} cls="big"><i className="vinyl" /></Cover>
        <div className="np-d"><span className="live-tag"><em className="eq"><i /><i /><i /><i /></em>Now playing on YouTube Music</span><h3>{np.t}</h3><p className="muted">{np.a} · {np.al}</p>
          <div className="prog"><i /></div><div className="prog-t mono muted small"><span>1:48</span><span>3:12</span></div>
          <div className="btns"><a className="btn sm" href={np.vid ? `https://music.youtube.com/watch?v=${np.vid}` : '/personal'} target={np.vid ? '_blank' : undefined} rel="noreferrer"><Icon n="play" size={14} fill="currentColor" sw={0} /> Play on YouTube Music</a><a className="btn sm ghost" href="/personal">My playlist ↗</a></div></div>
      </div>
      <div className="card"><h3>Top artists this month</h3>
        <div className="artists">{C.artists.map(([n, p, h]) => <a className="artist" href="/personal" key={n}><Cover m={{ h }} cls="round" /><b>{n}</b><em className="mono muted small">{p} plays</em></a>)}</div></div>
      <div className="card tracks-c"><div className="tracks-h"><h3>Most played tracks</h3><span className="mono muted small">Sample data. Add a track and paste its YouTube Music link: the cover loads by itself.</span></div>
        <ol className="tracks">{data.music.map((m, i) => (
          <Row key={m.t + i} kind="music" idx={i} as="li" name={m.t}>
            <Ctl kind="music" idx={i} />
            <span className="mono muted rk">{String(i + 1).padStart(2, '0')}</span>
            <Cover m={m} cls="sm"><span className="play"><Icon n="play" size={16} fill="currentColor" sw={0} /></span></Cover>
            <span className="tt"><b>{m.t}</b><em>{m.a}</em></span><span className="al muted">{m.al}</span>
            <span className="bar"><i style={{ '--w': `${m.p}%` }} /></span><span className="mono muted small pl">{m.p} plays</span>
          </Row>))}</ol></div>
    </div>
  );
}

function FavBlock() {
  const { data, editing, startEdit } = useApp();
  const isEditing = editing?.kind === 'fav';
  return (
    <section><h2 className="sec-label"><span className="sec-n" />Favourites<button className="btn sm ghost addnew edit-only" onClick={() => startEdit('fav', 0)}><Icon n="pen" size={14} sw={2.4} />Edit</button></h2>
      {isEditing ? <div className="card editing"><InlineForm kind="fav" idx={0} /></div> : (
        <div className="fav">
          <div className="card"><h3>Other interests</h3><div className="tags big">{data.favs.interests.map((t) => <Tag key={t}>{t}</Tag>)}</div></div>
          <div className="card"><h3>Favourite films</h3><div className="tags big">{data.favs.films.map((t) => <Tag key={t}>{t}</Tag>)}</div></div>
          <div className="card"><h3>Favourite games</h3><div className="tags big">{data.favs.games.map((t) => <Tag key={t}>{t}</Tag>)}</div></div>
          <div className="card"><h3>Music</h3><p className="muted">{data.favs.music}</p></div>
        </div>)}
    </section>
  );
}

export function Personal() {
  const { data, setLightbox } = useApp();
  const ZoomIcon = <span className="zoom"><Icon n="zoom" size={18} sw={2.2} /></span>;
  return (
    <>
      <section className="phero"><div className="ptxt"><span className="kicker mono">Beyond the code</span><h1>The person<br />behind the <em>code</em>.</h1>
        <p className="lead">Placeholder copy: replace with your own words. A few things I love outside of work: my sona, the mountains, the climbing wall and a good game.</p>
        <div className="chips">{['Sona', 'Mountains', 'Climbing', 'Gaming'].map((c) => <button key={c}>{c}</button>)}</div></div><Avatar /></section>

      <section><SecLabel>About me</SecLabel><About /></section>

      <section><SecLabel>Meet my sona</SecLabel>
        <div className="sona card">
          <button className="sheet-img" data-tip="Click to enlarge" data-tip-sub={data.main.t} onClick={() => setLightbox(0)}><img src={data.main.thumb || data.main.src} alt="Woofi in a purple hoodie" />{ZoomIcon}</button>
          <div className="sona-d"><h3>Woofi</h3><p className="mono muted small">Wolf</p><p className="lead">Shy, loves software engineering and rock climbing.</p>
            <div className="swatches">{SWATCHES.map(([n, c]) => <span key={n} style={{ '--c': c }} data-tip={n} data-tip-meta={c}><i />{n}</span>)}</div>
            <p className="muted small">His own colours. The Cobalt and Steel Blue palettes of this site were picked to sit next to them.</p><FindMe /></div>
        </div>
      </section>

      <section><SecLabel kind="gallery">More images</SecLabel><p className="muted small gal-n">Click any image to open it in full.</p>
        <div className="masonry">{data.gallery.map((g, i) => (
          <Row key={g.t + i} kind="gallery" idx={i} as="figure" className="tile" name={g.t} style={{ '--r': g.r }} data-tip="Click to enlarge" data-tip-sub={g.t} onClick={(e) => { if (!e.target.closest('.inline-form, .ctl, .confirm-bar')) setLightbox(i + 1); }}>
            <Ctl kind="gallery" idx={i} /><img src={g.thumb || g.src} alt={g.t} loading="lazy" />{ZoomIcon}
            <figcaption><b>{g.t}</b>{g.cap && <span className="muted small">{g.cap}</span>}</figcaption>
          </Row>))}</div></section>

      <section><SecLabel kind="music">On repeat</SecLabel><Music /></section>

      <section><SecLabel kind="hobby">Hobbies</SecLabel><div className="hobbies">{data.hobbies.map((h, i) => <HobbyCard key={h.t + i} h={h} idx={i} />)}</div></section>

      <FavBlock />

      <section className="cta-band"><h2>Say hi, whatever the reason.</h2><p>Work, a game night or just a good song recommendation.</p><a className="btn" href="/contact">Get in touch</a></section>
    </>
  );
}
