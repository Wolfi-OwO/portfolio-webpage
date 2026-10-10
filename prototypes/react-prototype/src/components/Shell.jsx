import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store.jsx';
import { useSecretCombo } from '../lib/useSecretCombo.js';
import { CTR, DEF, FACTORY, GROUPS, PALS, SLIDERS, currentAccentHex } from '../lib/appearance.js';
import { Icon } from './blocks.jsx';
import { C } from '../data/content.js';


// ---------- header: floating bar, exactly the live site's structure ----------
export function Header({ path }) {
  const navigate = useNavigate();
  const { auth, logout, theme, setTheme, toast } = useApp();
  const [secretFound] = useSecretCombo(); // the real hook from the app, copied as is
  const [lang, setLang] = useState('EN');
  const [menu, setMenu] = useState(false);
  useEffect(() => { const close = (e) => { if (!e.target.closest('#umenu, #lock')) setMenu(false); }; document.addEventListener('click', close); return () => document.removeEventListener('click', close); }, []);
  const links = [['/projects', 'Projects'], ['/services', 'Services'], ['/personal', 'Personal']];
  return (
    <>
      <header className={`topbar ${secretFound ? 'has-secret' : ''}`}>
        <a className="brand" href="/"><span className="logo-w">W</span><span className="bname"><b>Woofi</b>-Developments</span></a>
        <nav>
          {links.map(([h, l]) => <a key={h} href={h} className={path === h ? 'on' : ''}>{l}</a>)}
          {secretFound && (
            <a href="/secret" className={`secret-link ${path === '/secret' ? 'on' : ''}`}>
              <Icon n="heart" size={16} sw={1.8} style={{ color: '#e5675b' }} /><span>Another new Secret?!</span>
            </a>
          )}
        </nav>
        <div className="tools">
          <button className="tool lang" data-tip="Language" data-tip-sub="English · click for Deutsch" aria-label="Language" onClick={() => setLang(lang === 'EN' ? 'DE' : 'EN')}><Icon n="lang" /><b>{lang}</b></button>
          <button className="tool" data-tip="Theme" data-tip-sub="Switch light and dark" aria-label="Theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}><Icon n="monitor" /></button>
          <button id="lock" className="tool lockbtn" aria-label={auth ? 'Account menu' : 'Admin login'} data-tip={auth ? 'Signed in' : 'Admin'} data-tip-sub={auth ? 'Menu: messages, AI check, sign out' : 'Sign in to edit the site'}
            onClick={() => (auth ? setMenu((m) => !m) : navigate('/admin/login'))}>
            <span className={`ic ${auth ? 'ic-out' : 'ic-lock'}`}><Icon n={auth ? 'logout' : 'lock'} /></span>
          </button>
        </div>
      </header>
      <div className="umenu" id="umenu" hidden={!menu || !auth}>
        <a href="/admin?tab=messages" onClick={() => setMenu(false)}>Messages <em>{C.messages.filter((m) => m.unread).length}</em></a>
        <a href="/admin?tab=ai" onClick={() => setMenu(false)}>AI check</a>
        <button onClick={() => { setMenu(false); logout(); if (path.startsWith('/admin')) navigate('/'); }}>Sign out</button>
      </div>
    </>
  );
}

// ---------- footer: full width, flush, always visible ----------
export function Footer() {
  return (
    <footer className="bottombar">
      <div className="fl">© 2026 Woofi-Developments<br />All Rights Reserved.</div>
      <a className="buildchip" href="/" data-tip="Source on GitHub" data-tip-sub="Wolfi-OwO/portfolio-webpage" data-tip-meta="v6.5.0 · MIT licence"><Icon n="code2" size={14} />Wolfi-OwO/portfolio-webpage<i>·</i><span>v6.5.0</span></a>
      <nav className="fr">
        <a href="/status" data-tip="All systems operational" data-tip-meta="checked 12 s ago"><em className="live-dot" />Status</a>
        <a href="/privacy">Privacy Policy</a><a href="/impressum">Impressum</a><a href="/contact">Contact</a>
      </nav>
    </footer>
  );
}

export function Toasts() {
  const { toasts } = useApp();
  return <>{toasts.map((t) => <div key={t.id} className="toast in">{t.t}</div>)}</>;
}

// ---------- image dialog: whole picture, prev/next, keys ----------
export function Lightbox() {
  const { lightbox, setLightbox, data } = useApp();
  const list = [data.main, ...data.gallery];
  useEffect(() => {
    if (lightbox == null) return undefined;
    const key = (e) => { if (e.key === 'Escape') setLightbox(null); if (e.key === 'ArrowRight') setLightbox((i) => (i + 1) % list.length); if (e.key === 'ArrowLeft') setLightbox((i) => (i - 1 + list.length) % list.length); };
    addEventListener('keydown', key); return () => removeEventListener('keydown', key);
  }, [lightbox, list.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (lightbox == null) return null;
  const g = list[lightbox];
  return (
    <div className="modal lb in" onClick={(e) => { if (e.target === e.currentTarget) setLightbox(null); }}>
      <div className="lightbox" role="dialog" aria-modal="true" aria-label={g.t}>
        <button className="lbnav prev" aria-label="Previous" onClick={() => setLightbox((lightbox - 1 + list.length) % list.length)}>‹</button>
        <img src={g.src} alt={g.t} />
        <button className="lbnav next" aria-label="Next" onClick={() => setLightbox((lightbox + 1) % list.length)}>›</button>
        <div className="sheet-h"><div><h3>{g.t}</h3>{g.cap && <span className="mono muted small">{g.cap}</span>}</div><span className="mono muted small">{lightbox + 1} / {list.length}</span><button className="tool" aria-label="Close" onClick={() => setLightbox(null)}>✕</button></div>
      </div>
    </div>
  );
}

// ---------- appearance drawer ----------
export function Appearance() {
  const { drawer, setDrawer, palette, setPalette, theme, setTheme, contrast, setContrast, tune, setTune, toast } = useApp();
  const [tab, setTab] = useState('palette');
  const body = useRef(null);
  useEffect(() => { const k = (e) => { if (e.key === 'Escape') setDrawer(false); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [setDrawer]);
  const cur = PALS.find((p) => p.id === palette) || PALS[0];
  const set = (k, v) => setTune((t) => ({ ...t, [k]: v }));
  const copy = (kind) => {
    const d = document.documentElement;
    const txt = kind === 'json' ? JSON.stringify({ palette, theme, contrast, ...tune }, null, 2) : ':root{\n' + [...d.style].filter((p) => p.startsWith('--')).map((p) => `  ${p}: ${d.style.getPropertyValue(p)};`).join('\n') + '\n}';
    (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => toast('Copied to clipboard.')).catch(() => toast('Copy not available here.'));
  };
  return (
    <>
      <button className="palfab" aria-label="Appearance" data-tip="Change colours" data-tip-sub="Palette, mode and contrast" data-tip-meta="mockup control, not on the live site" onClick={() => setDrawer(!drawer)}>
        <span className="sw3 mini">{PALS.filter((p, i) => i % 4 === 0).slice(0, 8).map((p) => <i key={p.id} style={{ background: p.ad }} />)}</span>Appearance<small>mockup only</small>
      </button>
      <aside className={`drawer ${drawer ? 'open' : ''}`} id="drawer" aria-label="Appearance">
        <div className="dh"><b>Appearance</b><button className="tool" aria-label="Close" data-tip="Close" data-tip-key="Esc" onClick={() => setDrawer(false)}>✕</button></div>
        <div className="dtabs">{[['palette', 'Palette'], ['fine', 'Fine-tune']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
        <div className="db" id="db" ref={body}>
          {tab === 'palette' ? (
            <>
              {GROUPS.map(([g, t]) => (
                <div className="pgrp" key={g}><b className="mono muted small">{t}</b>
                  <div className="pgrid">{PALS.filter((p) => p.g === g).map((p) => (
                    <button key={p.id} className={`pchip ${palette === p.id ? 'on' : ''}`} data-tip={p.n} aria-label={p.n} onClick={() => { setPalette(p.id); setTune((x) => ({ ...x, hex: '' })); }}>
                      <span className="pdot" style={{ '--b': p.c[0], '--a': p.ad }} /><em>{p.n.replace('Classic ', '')}</em>
                    </button>))}</div></div>
              ))}
              <p className="pnote"><b>{cur.n}</b> {cur.w}</p>
              <div className="pp-row"><span className="mono muted small">Mode</span><span className="seg">{['dark', 'light'].map((m) => <button key={m} className={theme === m ? 'on' : ''} onClick={() => setTheme(m)}>{m[0].toUpperCase() + m.slice(1)}</button>)}</span></div>
              <div className="pp-row"><span className="mono muted small">Contrast</span><span className="seg">{CTR.map(([k, l]) => <button key={k} className={contrast === k ? 'on' : ''} onClick={() => setContrast(k)}>{l}</button>)}</span></div>
            </>
          ) : (
            <>
              <div className="pgrp"><b className="mono muted small">Exact accent colour</b>
                <label className="hexrow"><input type="color" value={tune.hex || currentAccentHex()} onChange={(e) => set('hex', e.target.value)} /><span className="mono small muted">{tune.hex || 'from palette'}</span><button className="btn sm ghost" onClick={() => set('hex', '')}>Use palette</button></label></div>
              {SLIDERS.map(([t, rows]) => (
                <div className="pgrp" key={t}><b className="mono muted small">{t}</b>
                  {rows.map(([k, l, mn, mx, u]) => (
                    <label className="srow" key={k}><span>{l}</span><output>{tune[k]}{u}</output>
                      <input type="range" min={mn} max={mx} value={tune[k]} style={{ '--p': `${Math.round((tune[k] - mn) / (mx - mn) * 100)}%` }} onChange={(e) => set(k, +e.target.value)} onDoubleClick={() => set(k, DEF[k])} /></label>))}
                </div>
              ))}
              <label className="switch"><input type="checkbox" checked={!!tune.motion} onChange={(e) => set('motion', e.target.checked ? 1 : 0)} /><i /><span>Reduce motion</span></label>
            </>
          )}
        </div>
        <div className="df">
          <button className="btn sm ghost" data-tip="Back to your saved look" data-tip-sub="Cobalt, low contrast, rounded" onClick={() => { setTune({ ...FACTORY }); setPalette('cobalt'); setContrast('low'); toast('Back to your saved look.'); }}>Reset</button>
          <button className="btn sm ghost" data-tip="Clear every adjustment" data-tip-sub="Plain palette, no tuning" onClick={() => { setTune({ ...DEF }); toast('All adjustments cleared.'); }}>Neutral</button>
          <button className="btn sm ghost" onClick={() => copy('json')}>Copy settings</button><button className="btn sm" onClick={() => copy('css')}>Copy CSS</button>
        </div>
      </aside>
    </>
  );
}
