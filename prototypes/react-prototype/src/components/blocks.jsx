import { useRef, useState } from 'react';
import { LIST_OF, useApp } from '../store.jsx';

// ---------- icons (stroke icons share one wrapper; paths are plain strings) ----------
export function Svg({ d, size = 20, sw = 2, fill = 'none', className, style }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d }} />;
}
export const P = {
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14M10 11v6M14 11v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  lock: '<rect x="4.5" y="11" width="15" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  lang: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  mountain: '<path d="m2 20 7-12 4 6 3-4 6 10H2Z"/><path d="m9 8 1.8 3"/>',
  climb: '<path d="M12 21V4M7 9l5-5 5 5M5 14h4M15 17h4M6 20h3"/>',
  pad: '<rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7 12.5h4M9 10.5v4"/><circle cx="16" cy="11.5" r=".9"/><circle cx="18.2" cy="13.5" r=".9"/>',
  note: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  zoom: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
  tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.3-.5-.5-2.3 2.5-2.5Z"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12Z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  telegram: '<path d="M21.5 3 2.5 10.5l6 2.2 2.3 6.8 3.2-4.2 5 3.7L21.5 3ZM8.5 12.7 18 6.5"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.8 0-1.4-1.2-1.6-1.2-2.8 0-1 .8-1.6 1.8-1.6H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  heart: '<path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  code2: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
};
export const Icon = ({ n, ...rest }) => <Svg d={P[n]} {...rest} />;

// ---------- small shared pieces ----------
export const Tag = ({ children }) => <span className="tag">{children}</span>;

export function AddBtn({ kind, label = 'New entry' }) {
  const { add } = useApp();
  return <button className="btn sm ghost addnew edit-only" onClick={() => add(kind)}><Icon n="plus" size={14} sw={2.4} />{label}</button>;
}

export function SecLabel({ n = '', children, kind }) {
  return <h2 className="sec-label"><span className="sec-n">{n}</span>{children}{kind && <AddBtn kind={kind} />}</h2>;
}

// pencil + trash, only while signed in
export function Ctl({ kind, idx }) {
  const { auth, startEdit, setConfirming } = useApp();
  if (!auth) return null;
  return (
    <span className="ctl edit-only">
      <button className="pen" aria-label="Edit" data-tip="Edit" data-tip-sub="Changes the entry right here" onClick={(e) => { e.stopPropagation(); startEdit(kind, idx); }}><Icon n="pen" size={16} sw={2.2} /></button>
      <button className="pen del" aria-label="Delete" data-tip="Delete" data-tip-sub="Asks first" onClick={(e) => { e.stopPropagation(); setConfirming({ kind, idx }); }}><Icon n="trash" size={16} sw={2.2} /></button>
    </span>
  );
}

export function useRow(kind, idx) {
  const { editing, confirming } = useApp();
  return { isEditing: editing?.kind === kind && editing?.idx === idx, isConfirming: confirming?.kind === kind && confirming?.idx === idx };
}

export function ConfirmBar({ kind, idx, name }) {
  const { confirmRemove, setConfirming } = useApp();
  return (
    <div className="confirm-bar">
      <span>Delete “{name || 'this entry'}”? This cannot be undone.</span>
      <button className="btn sm danger" onClick={() => confirmRemove(kind, idx)}>Yes, delete</button>
      <button className="btn sm ghost" onClick={() => setConfirming(null)}>Keep</button>
    </div>
  );
}

// ---------- the inline form (one definition per kind of entry) ----------
const SPEC = {
  career: { title: 'career entry', f: [['t', 'Title'], ['o', 'Organisation'], ['loc', 'Location'], ['from', 'From', 'half'], ['to', 'To (empty = now)', 'half'], ['k', 'Kind', 'select:work,education'], ['d', 'Description', 'area'], ['tags', 'Tags (comma separated)']] },
  timeline: { title: 'availability entry', f: [['t', 'Title'], ['from', 'From', 'half'], ['to', 'To (empty = open)', 'half'], ['k', 'Kind', 'select:work,military,education,available,unavailable'], ['d', 'Description', 'area']] },
  service: { title: 'service', f: [['t', 'Title'], ['cat', 'Category', 'select:Web,Mobile,Desktop,Other'], ['d', 'Description', 'area'], ['del', 'Deliverables (one per line)', 'area'], ['price', 'Price from', 'half'], ['rate', 'Hourly rate', 'half'], ['dur', 'Duration']] },
  project: { title: 'project', f: [['t', 'Title'], ['d', 'Description', 'area'], ['live', 'Live demo URL'], ['tech', 'Technologies (comma separated)']] },
  gallery: { title: 'gallery item', f: [['t', 'Title'], ['cap', 'Caption (optional)']] },
  hobby: { title: 'hobby', f: [['t', 'Name'], ['tags', 'Details (comma separated)']] },
  music: { title: 'track', f: [['link', 'YouTube Music link (paste it, the cover loads by itself)'], ['t', 'Track'], ['a', 'Artist'], ['al', 'Album']] },
  fav: { title: 'favourites', f: [['interests', 'Other interests (comma separated)', 'area'], ['films', 'Films (comma separated)', 'area'], ['games', 'Games (comma separated)', 'area']] },
};
const LISTY = ['tags', 'tech', 'films', 'games', 'interests'];
export const ytId = (u) => (String(u).match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([\w-]{11})/) || [])[1] || '';
export const ytCover = (vid) => `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;

export function InlineForm({ kind, idx }) {
  const { data, save, cancel, toast } = useApp();
  const spec = SPEC[kind];
  const item = kind === 'fav' ? data.favs : data[LIST_OF[kind]][idx];
  const [vid, setVid] = useState(item.vid || '');
  const form = useRef(null);
  const val = (k) => (Array.isArray(item[k]) ? item[k].join(k === 'del' ? '\n' : ', ') : item[k] ?? (k === 'link' && item.vid ? `https://music.youtube.com/watch?v=${item.vid}` : ''));

  // paste a YouTube Music link: show the cover right away, fill title/artist if the oEmbed endpoint answers
  const onLink = async (e) => {
    const id = ytId(e.target.value); setVid(id); if (!id) return;
    try {
      const r = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}&format=json`);
      if (!r.ok) return; const j = await r.json(); const f = form.current.elements;
      if (!f.t.value) f.t.value = j.title; if (!f.a.value) f.a.value = String(j.author_name || '').replace(/ - Topic$/, '');
    } catch { /* offline or blocked: the cover alone is fine */ }
  };

  const submit = (e) => {
    e.preventDefault(); const out = {};
    for (const [k, v] of new FormData(e.target).entries()) {
      if (k === '_pub') continue;
      out[k] = LISTY.includes(k) ? v.split(',').map((x) => x.trim()).filter(Boolean) : k === 'del' ? v.split('\n').map((x) => x.trim()).filter(Boolean) : v;
    }
    if (kind === 'music') out.vid = ytId(out.link);
    if (kind !== 'fav' && !String(out.t || '').trim()) { form.current.elements.t.focus(); return toast('A title is required.'); }
    save(kind, idx, out);
  };

  const field = ([k, label, t = '']) => t.startsWith('select')
    ? <label key={k} className="fld">{label}<select name={k} defaultValue={val(k)}>{t.slice(7).split(',').map((o) => <option key={o}>{o}</option>)}</select></label>
    : t === 'area' ? <label key={k} className="fld wide">{label}<textarea name={k} rows={3} defaultValue={val(k)} /></label>
      : <label key={k} className={`fld ${t === 'half' ? '' : 'wide'}`}>{label}<input name={k} defaultValue={val(k)} onBlur={k === 'link' ? onLink : undefined} autoFocus={k === spec.f[0][0]} /></label>;

  return (
    <form className="inline-form" ref={form} onSubmit={submit}>
      <div className="if-h"><span className="kicker mono">{item._new ? 'New' : 'Edit'} {spec.title}</span></div>
      {kind === 'music' && vid && <div className="yt-preview"><img src={ytCover(vid)} alt="" /><span className="mono muted small">Cover from YouTube</span></div>}
      <div className="fields">{spec.f.map(field)}</div>
      <label className="switch"><input type="checkbox" name="_pub" defaultChecked /><i /><span>Published, visible on the website</span></label>
      <div className="if-f"><button type="button" className="btn sm ghost" onClick={cancel}>Cancel</button><button className="btn sm">Save</button></div>
    </form>
  );
}

// Wraps one editable entry: shows the form while editing, the delete confirmation while confirming.
export function Row({ kind, idx, as: Tag2 = 'div', className = '', name, children, ...rest }) {
  const { isEditing, isConfirming } = useRow(kind, idx);
  return (
    <Tag2 className={`${className} ${isEditing ? 'editing' : ''}`} {...rest}>
      {isEditing ? <InlineForm kind={kind} idx={idx} /> : (<>{isConfirming && <ConfirmBar kind={kind} idx={idx} name={name} />}{children}</>)}
    </Tag2>
  );
}
