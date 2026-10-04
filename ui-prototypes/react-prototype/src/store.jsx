import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { C as SEED } from './data/content.js';
import { CTR, DEF, FACTORY, PALS, applyCustom, injectPalettes, lsGet, lsSet } from './lib/appearance.js';

// Which list in the content a given kind of entry lives in.
export const LIST_OF = { career: 'career', timeline: 'timeline', service: 'services', project: 'projects', gallery: 'gallery', hobby: 'hobbies', music: 'music' };
export const BLANK = {
  career: () => ({ t: '', o: '', loc: '', from: '', to: '', k: 'work', d: '', tags: [] }),
  timeline: () => ({ t: '', from: '', to: '', k: 'work', d: '', state: 'next' }),
  service: () => ({ t: '', cat: 'Web', d: '', del: [], price: 'on request', rate: '€30 / h', dur: '' }),
  project: () => ({ t: '', d: '', tech: [], live: '' }),
  gallery: () => ({ t: '', cap: '', src: '/assets/sona/headshot.webp', r: '1/1' }),
  hobby: () => ({ t: '', icon: 'code', tags: [] }),
  music: () => ({ t: '', a: '', al: '', p: 10, h: [220, 280], vid: '' }),
};

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [data, setData] = useState(() => structuredClone(SEED));
  const [auth, setAuth] = useState(() => sessionStorage.getItem('adm') === '1');
  const [editing, setEditing] = useState(null); // { kind, idx }
  const [confirming, setConfirming] = useState(null); // { kind, idx }
  const [toasts, setToasts] = useState([]);
  const [lightbox, setLightbox] = useState(null); // index into [main, ...gallery]

  // ---- appearance ----
  const [palette, setPalette] = useState(() => (PALS.some((p) => p.id === lsGet('pal')) ? lsGet('pal') : 'cobalt'));
  const [theme, setThemeState] = useState(() => (['dark', 'light'].includes(lsGet('thm')) ? lsGet('thm') : 'dark'));
  const [contrast, setContrast] = useState(() => (CTR.some(([k]) => k === lsGet('ctr')) ? lsGet('ctr') : 'low'));
  const [tune, setTune] = useState(() => { try { const raw = lsGet('cust', ''); return raw ? { ...DEF, ...JSON.parse(raw) } : { ...FACTORY }; } catch { return { ...FACTORY }; } });
  const [drawer, setDrawer] = useState(false);

  useEffect(() => { injectPalettes(); }, []);
  useEffect(() => {
    const d = document.documentElement.dataset; d.palette = palette; d.theme = theme; d.contrast = contrast;
    lsSet('pal', palette); lsSet('thm', theme); lsSet('ctr', contrast); lsSet('cust', JSON.stringify(tune));
    applyCustom(tune);
  }, [palette, theme, contrast, tune]);
  useEffect(() => { document.documentElement.dataset.auth = auth ? 'on' : 'off'; }, [auth]);

  const toast = useCallback((t) => {
    const id = Math.random();
    setToasts((x) => [...x, { id, t }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 2400);
  }, []);

  // ---- inline editing ----
  const login = () => { sessionStorage.setItem('adm', '1'); setAuth(true); };
  const logout = () => { sessionStorage.removeItem('adm'); setAuth(false); setEditing(null); setConfirming(null); toast('Signed out.'); };

  const startEdit = (kind, idx) => { setConfirming(null); setEditing({ kind, idx }); };
  const add = (kind) => {
    if (kind === 'fav') return startEdit('fav', 0);
    setData((d) => { const n = structuredClone(d); n[LIST_OF[kind]].unshift({ ...BLANK[kind](), _new: true }); return n; });
    setConfirming(null); setEditing({ kind, idx: 0 });
  };
  const removeAt = (kind, idx) => { setData((d) => { const n = structuredClone(d); n[LIST_OF[kind]].splice(idx, 1); return n; }); setEditing(null); setConfirming(null); };
  const cancel = () => {
    if (editing && editing.kind !== 'fav' && data[LIST_OF[editing.kind]][editing.idx]?._new) removeAt(editing.kind, editing.idx);
    else setEditing(null);
  };
  const save = (kind, idx, values) => {
    setData((d) => {
      const n = structuredClone(d);
      if (kind === 'fav') Object.assign(n.favs, values);
      else { const it = n[LIST_OF[kind]][idx]; Object.assign(it, values); delete it._new; }
      return n;
    });
    setEditing(null); toast('Saved. The change is live.');
  };
  const confirmRemove = (kind, idx) => { removeAt(kind, idx); toast('Entry deleted.'); };

  const value = useMemo(() => ({
    data, auth, login, logout, editing, confirming, setConfirming, startEdit, add, cancel, save, confirmRemove,
    toasts, toast, lightbox, setLightbox,
    palette, setPalette, theme, setTheme: setThemeState, contrast, setContrast, tune, setTune, drawer, setDrawer,
  }), [data, auth, editing, confirming, toasts, lightbox, palette, theme, contrast, tune, drawer]); // eslint-disable-line react-hooks/exhaustive-deps

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
