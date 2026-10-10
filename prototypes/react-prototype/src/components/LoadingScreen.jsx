import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

// Ported unchanged from the live app's components/loading-screen.jsx (Tailwind classes became .bootx rules).
export const BOOT_SESSION_KEY = 'boot-seen';
export function shouldBoot() {
  if (new URLSearchParams(location.search).has('noboot')) return false; // prototype switch for tests
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return sessionStorage.getItem(BOOT_SESSION_KEY) !== '1';
}

const LINES = [
  { after: 0, kind: 'cmd', text: 'node server/src/server.js' },
  { after: 480, kind: 'log', text: 'Backend - Starting configuration...' },
  { after: 340, kind: 'log', text: 'Backend - Starting up ...' },
  { after: 540, kind: 'log', text: 'DB - Setting up connection using mongodb+srv://***' },
  { after: 600, kind: 'log', text: 'DB - Connection established.' },
  { after: 380, kind: 'log', text: 'Backend - Running on port 8080...' },
  { after: 480, kind: 'ready', text: 'ready' },
];
const TOTAL_MS = LINES.reduce((sum, l) => sum + l.after, 0);
const HOLD_MS = 700;
const FADE_MS = 320;

function stamp(date = new Date()) {
  const pad = (n, width = 2) => String(n).padStart(width, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
}

function Line({ line, at }) {
  if (line.kind === 'cmd') return <p><span className="b-accent">woofi@portfolio</span><span className="b-muted">:~$</span>{' '}<span className="b-text">{line.text}</span></p>;
  if (line.kind === 'ready') return <p className="b-live">{line.text}</p>;
  return <p className="b-muted"><span className="b-line">[{at}]</span>{' '}<span className="b-muted">info:</span>{' '}<span className="b-text">{line.text}</span></p>;
}

export default function LoadingScreen({ onDone }) {
  const [printed, setPrinted] = useState([]);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => { sessionStorage.setItem(BOOT_SESSION_KEY, '1'); }, []);
  useEffect(() => {
    const next = printed.length;
    if (next >= LINES.length) return undefined;
    const id = setTimeout(() => setPrinted((rows) => [...rows, { index: next, at: stamp() }]), LINES[next].after);
    return () => clearTimeout(id);
  }, [printed]);
  useEffect(() => {
    const fade = setTimeout(() => setLeaving(true), TOTAL_MS + HOLD_MS);
    const done = setTimeout(onDone, TOTAL_MS + HOLD_MS + FADE_MS);
    return () => { clearTimeout(fade); clearTimeout(done); };
  }, [onDone]);
  return createPortal(
    <div role="status" aria-label="Starting" className={`bootx ${leaving ? 'leaving' : ''}`}>
      <div className="bootx-lines">
        {printed.map((row) => <Line key={row.index} line={LINES[row.index]} at={row.at} />)}
        <span aria-hidden="true" className="bootx-caret" />
      </div>
    </div>,
    document.body,
  );
}
