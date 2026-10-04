import { useEffect, useState } from 'react';
import {
    CTR,
    DEF,
    FACTORY,
    GROUPS,
    PALS,
    SLIDERS,
    applyCustom,
    currentAccentHex,
    injectPalettes,
    lsGet,
    lsSet,
} from '../utils/appearance.js';
import '../appearance.css';
import '../tooltip.css';
import '../utils/tooltip.js';

// Palette, contrast and fine-tune controls. The layout owns light/dark (it also follows the OS), this panel owns everything else
// and mirrors the resolved mode into data-theme so the palette CSS can key off it.
const DEFAULT_PALETTE = 'cobalt';

export default function AppearancePanel({ theme, setTheme }) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('palette');
    const [palette, setPalette] = useState(() =>
        PALS.some((p) => p.id === lsGet('pal')) ? lsGet('pal') : DEFAULT_PALETTE,
    );
    const [contrast, setContrast] = useState(() =>
        CTR.some(([k]) => k === lsGet('ctr')) ? lsGet('ctr') : 'low',
    );
    const [tune, setTune] = useState(() => {
        try {
            const raw = lsGet('cust', '');
            return raw ? { ...DEF, ...JSON.parse(raw) } : { ...FACTORY };
        } catch {
            return { ...FACTORY };
        }
    });
    const [mode, setMode] = useState(() =>
        document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    );

    useEffect(() => {
        injectPalettes();
    }, []);
    useEffect(() => {
        const sync = () =>
            setMode(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        sync();
        const mo = new MutationObserver(sync);
        mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => mo.disconnect();
    }, []);
    useEffect(() => {
        const d = document.documentElement.dataset;
        d.palette = palette;
        d.theme = mode;
        d.contrast = contrast;
        lsSet('pal', palette);
        lsSet('ctr', contrast);
        lsSet('cust', JSON.stringify(tune));
        applyCustom(tune);
    }, [palette, mode, contrast, tune]);
    useEffect(() => {
        const k = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        addEventListener('keydown', k);
        return () => removeEventListener('keydown', k);
    }, []);

    const cur = PALS.find((p) => p.id === palette) || PALS[0];
    const set = (k, v) => setTune((t) => ({ ...t, [k]: v }));
    const copy = (kind) => {
        const d = document.documentElement;
        const txt =
            kind === 'json'
                ? JSON.stringify({ palette, theme, contrast, ...tune }, null, 2)
                : ':root{\n' +
                  [...d.style]
                      .filter((p) => p.startsWith('--'))
                      .map((p) => `  ${p}: ${d.style.getPropertyValue(p)};`)
                      .join('\n') +
                  '\n}';
        navigator.clipboard?.writeText(txt);
    };

    return (
        <>
            <button
                className="palfab"
                aria-label="Appearance"
                data-tip="Change colours"
                data-tip-sub="Palette, mode and contrast"
                onClick={() => setOpen(!open)}
            >
                <span className="sw3 mini">
                    {PALS.filter((p, i) => i % 4 === 0)
                        .slice(0, 8)
                        .map((p) => (
                            <i key={p.id} style={{ background: p.ad }} />
                        ))}
                </span>
                Appearance
            </button>
            <aside className={`drawer ${open ? 'open' : ''}`} aria-label="Appearance">
                <div className="dh">
                    <b>Appearance</b>
                    <button className="tool" aria-label="Close" onClick={() => setOpen(false)}>
                        ✕
                    </button>
                </div>
                <div className="dtabs">
                    {[
                        ['palette', 'Palette'],
                        ['fine', 'Fine-tune'],
                    ].map(([k, l]) => (
                        <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                            {l}
                        </button>
                    ))}
                </div>
                <div className="db">
                    {tab === 'palette' ? (
                        <>
                            {GROUPS.map(([g, t]) => (
                                <div className="pgrp" key={g}>
                                    <b className="mono muted small">{t}</b>
                                    <div className="pgrid">
                                        {PALS.filter((p) => p.g === g).map((p) => (
                                            <button
                                                key={p.id}
                                                className={`pchip ${palette === p.id ? 'on' : ''}`}
                                                data-tip={p.n}
                                                aria-label={p.n}
                                                onClick={() => {
                                                    setPalette(p.id);
                                                    setTune((x) => ({ ...x, hex: '' }));
                                                }}
                                            >
                                                <span
                                                    className="pdot"
                                                    style={{ '--b': p.c[0], '--a': p.ad }}
                                                />
                                                <em>{p.n.replace('Classic ', '')}</em>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <p className="pnote">
                                <b>{cur.n}</b> {cur.w}
                            </p>
                            <div className="pp-row">
                                <span className="mono muted small">Mode</span>
                                <span className="seg">
                                    {[
                                        ['light', 'Light'],
                                        ['dark', 'Dark'],
                                        ['system', 'Auto'],
                                    ].map(([m, l]) => (
                                        <button
                                            key={m}
                                            className={theme === m ? 'on' : ''}
                                            onClick={() => setTheme(m)}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </span>
                            </div>
                            <div className="pp-row">
                                <span className="mono muted small">Contrast</span>
                                <span className="seg">
                                    {CTR.map(([k, l]) => (
                                        <button
                                            key={k}
                                            className={contrast === k ? 'on' : ''}
                                            onClick={() => setContrast(k)}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="pgrp">
                                <b className="mono muted small">Exact accent colour</b>
                                <label className="hexrow">
                                    <input
                                        type="color"
                                        value={tune.hex || currentAccentHex()}
                                        onChange={(e) => set('hex', e.target.value)}
                                    />
                                    <span className="mono small muted">
                                        {tune.hex || 'from palette'}
                                    </span>
                                    <button className="btn sm ghost" onClick={() => set('hex', '')}>
                                        Use palette
                                    </button>
                                </label>
                            </div>
                            {SLIDERS.map(([t, rows]) => (
                                <div className="pgrp" key={t}>
                                    <b className="mono muted small">{t}</b>
                                    {rows.map(([k, l, mn, mx, u]) => (
                                        <label className="srow" key={k}>
                                            <span>{l}</span>
                                            <output>
                                                {tune[k]}
                                                {u}
                                            </output>
                                            <input
                                                type="range"
                                                min={mn}
                                                max={mx}
                                                value={tune[k]}
                                                style={{
                                                    '--p': `${Math.round(((tune[k] - mn) / (mx - mn)) * 100)}%`,
                                                }}
                                                onChange={(e) => set(k, +e.target.value)}
                                                onDoubleClick={() => set(k, DEF[k])}
                                            />
                                        </label>
                                    ))}
                                </div>
                            ))}
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={!!tune.motion}
                                    onChange={(e) => set('motion', e.target.checked ? 1 : 0)}
                                />
                                <i />
                                <span>Reduce motion</span>
                            </label>
                        </>
                    )}
                </div>
                <div className="df">
                    <button
                        className="btn sm ghost"
                        onClick={() => {
                            setTune({ ...FACTORY });
                            setPalette(DEFAULT_PALETTE);
                            setContrast('low');
                        }}
                    >
                        Reset
                    </button>
                    <button className="btn sm ghost" onClick={() => setTune({ ...DEF })}>
                        Neutral
                    </button>
                    <button className="btn sm ghost" onClick={() => copy('json')}>
                        Copy settings
                    </button>
                    <button className="btn sm" onClick={() => copy('css')}>
                        Copy CSS
                    </button>
                </div>
            </aside>
        </>
    );
}
