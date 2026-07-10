import { useEffect, useState } from 'react';
import { BOOT_SESSION_KEY } from '../utils/boot.js';

/**
 * The real boot of this app, not invented shell poetry. The command is the
 * `CMD` from server/dockerfile, and the log lines are what utils/logger.js
 * actually prints on startup (the Mongo URI redacted, obviously).
 *
 * Delays are uneven on purpose: real output doesn't arrive on a metronome.
 */
const LINES = [
    { after: 0, kind: 'cmd', text: 'node server/src/server.js' },
    { after: 240, kind: 'log', at: '0.01s', text: 'Backend - Starting configuration...' },
    { after: 110, kind: 'log', at: '0.03s', text: 'Backend - Starting up ...' },
    { after: 290, kind: 'log', at: '0.30s', text: 'DB - Setting up connection using mongodb+srv://***' },
    { after: 330, kind: 'log', at: '0.62s', text: 'DB - Connection established.' },
    { after: 80, kind: 'log', at: '0.70s', text: 'Backend - Running on port 8080...' },
    { after: 190, kind: 'ready', text: 'ready' },
];

const TOTAL_MS = LINES.reduce((sum, l) => sum + l.after, 0);
const FADE_MS = 320;

function Line({ line }) {
    if (line.kind === 'cmd') {
        return (
            <p>
                <span className="text-[var(--accent)]">woofi@portfolio</span>
                <span className="text-[var(--muted)]">:~$</span>{' '}
                <span className="text-[var(--text)]">{line.text}</span>
            </p>
        );
    }

    if (line.kind === 'ready') {
        return <p className="text-[var(--live)]">{line.text}</p>;
    }

    return (
        <p className="text-[var(--muted)]">
            <span className="text-[var(--line)]">[{line.at}]</span>{' '}
            <span className="text-[var(--muted)]">info:</span>{' '}
            <span className="text-[var(--text)]">{line.text}</span>
        </p>
    );
}

export default function LoadingScreen({ onDone }) {
    const [printed, setPrinted] = useState(0);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        sessionStorage.setItem(BOOT_SESSION_KEY, '1');
    }, []);

    // Print the next line after its own (uneven) delay.
    useEffect(() => {
        if (printed >= LINES.length) return undefined;
        const id = setTimeout(() => setPrinted(n => n + 1), LINES[printed].after);
        return () => clearTimeout(id);
    }, [printed]);

    useEffect(() => {
        const fade = setTimeout(() => setLeaving(true), TOTAL_MS + 260);
        const done = setTimeout(onDone, TOTAL_MS + 260 + FADE_MS);
        return () => {
            clearTimeout(fade);
            clearTimeout(done);
        };
    }, [onDone]);

    return (
        <div
            role="status"
            aria-label="Starting"
            className={`fixed inset-0 z-50 overflow-hidden bg-[var(--bg)] p-6 transition-opacity duration-300 sm:p-10 ${
                leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
        >
            <div className="space-y-0.5 font-mono text-[13px] leading-relaxed">
                {LINES.slice(0, printed).map((line, i) => (
                    <Line key={i} line={line} />
                ))}

                <span
                    aria-hidden="true"
                    className="inline-block h-[1.05em] w-[0.6em] translate-y-[0.18em] bg-[var(--text)] animate-caret"
                />
            </div>
        </div>
    );
}
