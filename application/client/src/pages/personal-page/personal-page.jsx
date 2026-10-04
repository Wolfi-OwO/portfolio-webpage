import { useEffect, useState } from 'react';
import { P } from './personal-data.js';
import { Icon } from '../../components/proto-icons.jsx';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import '../../proto.css';

// Styles come from proto.css and only apply inside .pw, so the Tailwind pages are untouched.
const SWATCHES = [
    ['Slate', '#5d6376'],
    ['Steel', '#476a7d'],
    ['Ice', '#96d1e1'],
    ['Ink', '#262626'],
    ['Lavender', '#d4daf0'],
    ['Salmon', '#e3978b'],
];
const FINDME = [
    ['Discord', 'woofiowo', 'chat', null],
    ['Telegram', '@WolfiOwO', 'telegram', 'https://t.me/WolfiOwO'],
    ['Barq', '@Woofi', 'heart', null],
];
const Tag = ({ children }) => <span className="tag">{children}</span>;
const Zoom = (
    <span className="zoom">
        <Icon n="zoom" size={18} sw={2.2} />
    </span>
);
const Cover = ({ m, cls, children }) => (
    <span className={`cover ${cls}`} style={{ '--h1': m.h?.[0], '--h2': m.h?.[1] }}>
        {m.vid ? (
            <img className="yt" src={`https://i.ytimg.com/vi/${m.vid}/hqdefault.jpg`} alt="" />
        ) : (
            <Icon n="note" size={cls === 'big' ? 56 : cls === 'sm' ? 20 : 28} sw={1.8} />
        )}
        {children}
    </span>
);
const Label = ({ children }) => (
    <h2 className="sec-label">
        <span className="sec-n" />
        {children}
    </h2>
);

export default function PersonalPage() {
    usePageMeta('Personal', 'The person behind the code: my sona, art, music and hobbies.');
    const [lb, setLb] = useState(null);
    const [toast, setToast] = useState('');
    const list = [P.main, ...P.gallery];
    useEffect(() => {
        if (lb == null) return undefined;
        const key = (e) => {
            if (e.key === 'Escape') setLb(null);
            if (e.key === 'ArrowRight') setLb((i) => (i + 1) % list.length);
            if (e.key === 'ArrowLeft') setLb((i) => (i - 1 + list.length) % list.length);
        };
        addEventListener('keydown', key);
        return () => removeEventListener('keydown', key);
    }, [lb, list.length]);
    const copy = (v) => {
        navigator.clipboard?.writeText(v);
        setToast('Copied to clipboard.');
        setTimeout(() => setToast(''), 2200);
    };
    const np = P.music[0];
    const g = lb != null ? list[lb] : null;

    return (
        <div className="pw">
            <div className="page" style={{ padding: 0, maxWidth: 1040 }}>
                <section className="phero">
                    <div className="ptxt">
                        <span className="kicker mono">Beyond the code</span>
                        <h1>
                            The person
                            <br />
                            behind the <em>code</em>.
                        </h1>
                        <p className="lead">
                            A few things I love outside of work: my sona, the mountains, the
                            climbing wall and a good game.
                        </p>
                    </div>
                    <div className="avatar">
                        <img src="/assets/sona/icon.gif" alt="Woofi, my sona" />
                    </div>
                </section>

                <section>
                    <Label>Meet my sona</Label>
                    <div className="sona card">
                        <button
                            className="sheet-img"
                            data-tip="Click to enlarge"
                            data-tip-sub={P.main.t}
                            onClick={() => setLb(0)}
                        >
                            <img src={P.main.thumb || P.main.src} alt="Woofi in a purple hoodie" />
                            {Zoom}
                        </button>
                        <div className="sona-d">
                            <h3>Woofi</h3>
                            <p className="mono muted small">Wolf</p>
                            <p className="lead">
                                Shy, loves software engineering and rock climbing.
                            </p>
                            <div className="swatches">
                                {SWATCHES.map(([n, c]) => (
                                    <span
                                        key={n}
                                        style={{ '--c': c }}
                                        data-tip={n}
                                        data-tip-meta={c}
                                    >
                                        <i />
                                        {n}
                                    </span>
                                ))}
                            </div>
                            <div className="findme">
                                <span className="mono muted small">Find me</span>
                                {FINDME.map(([n, v, ic, href]) =>
                                    href ? (
                                        <a
                                            key={n}
                                            className="fm"
                                            href={href}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            <Icon n={ic} size={16} />
                                            <span>{v}</span>
                                        </a>
                                    ) : (
                                        <button
                                            key={n}
                                            className="fm"
                                            data-tip={n}
                                            data-tip-sub="Click to copy"
                                            onClick={() => copy(v)}
                                        >
                                            <Icon n={ic} size={16} />
                                            <span>{v}</span>
                                        </button>
                                    ),
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <Label>More images</Label>
                    <p className="muted small gal-n">Click any image to open it in full.</p>
                    <div className="masonry">
                        {P.gallery.map((it, i) => (
                            <figure
                                key={it.t}
                                className="tile"
                                style={{ '--r': it.r }}
                                data-tip="Click to enlarge"
                                data-tip-sub={it.t}
                                onClick={() => setLb(i + 1)}
                            >
                                <img src={it.thumb || it.src} alt={it.t} loading="lazy" />
                                {Zoom}
                                <figcaption>
                                    <b>{it.t}</b>
                                    {it.cap && <span className="muted small">{it.cap}</span>}
                                </figcaption>
                            </figure>
                        ))}
                    </div>
                </section>

                <section>
                    <Label>On repeat</Label>
                    <div className="music">
                        <div className="card np">
                            <Cover m={np} cls="big">
                                <i className="vinyl" />
                            </Cover>
                            <div className="np-d">
                                <h3>{np.t}</h3>
                                <p className="muted">
                                    {np.a} · {np.al}
                                </p>
                                {np.vid && (
                                    <div className="btns">
                                        <a
                                            className="btn sm"
                                            href={`https://music.youtube.com/watch?v=${np.vid}`}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Play on YouTube Music
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="card tracks-c">
                            <div className="tracks-h">
                                <h3>Most played tracks</h3>
                                <span className="mono muted small">
                                    Example data until a music source is connected.
                                </span>
                            </div>
                            <ol className="tracks">
                                {P.music.map((m, i) => (
                                    <li key={m.t + i}>
                                        <span className="mono muted rk">
                                            {String(i + 1).padStart(2, '0')}
                                        </span>
                                        <Cover m={m} cls="sm" />
                                        <span className="tt">
                                            <b>{m.t}</b>
                                            <em>{m.a}</em>
                                        </span>
                                        <span className="al muted">{m.al}</span>
                                        <span className="bar">
                                            <i style={{ '--w': `${m.p}%` }} />
                                        </span>
                                        <span className="mono muted small pl">{m.p} plays</span>
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>
                </section>

                <section>
                    <Label>Hobbies</Label>
                    <div className="hobbies">
                        {P.hobbies.map((h, i) => (
                            <article key={h.t} className="card hobby" style={{ '--i': i }}>
                                <span className="hico">
                                    <Icon n={h.icon} size={26} sw={1.9} />
                                </span>
                                <h3>{h.t}</h3>
                                {h.tags.length > 0 && (
                                    <div className="tags">
                                        {h.tags.map((t) => (
                                            <Tag key={t}>{t}</Tag>
                                        ))}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                </section>

                <section>
                    <Label>Favourites</Label>
                    <div className="fav">
                        {[
                            ['Other interests', P.favs.interests],
                            ['Favourite films', P.favs.films],
                            ['Favourite games', P.favs.games],
                        ].map(([t, l]) => (
                            <div className="card" key={t}>
                                <h3>{t}</h3>
                                <div className="tags big">
                                    {l.map((x) => (
                                        <Tag key={x}>{x}</Tag>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div className="card">
                            <h3>Music</h3>
                            <p className="muted">{P.favs.music}</p>
                        </div>
                    </div>
                </section>

                <section className="cta-band">
                    <h2>Say hi, whatever the reason.</h2>
                    <p>Work, a game night or just a good song recommendation.</p>
                    <a className="btn" href="/contact">
                        Get in touch
                    </a>
                </section>
            </div>

            {g && (
                <div
                    className="modal lb in"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setLb(null);
                    }}
                >
                    <div className="lightbox" role="dialog" aria-modal="true" aria-label={g.t}>
                        <button
                            className="lbnav prev"
                            aria-label="Previous"
                            onClick={() => setLb((lb - 1 + list.length) % list.length)}
                        >
                            ‹
                        </button>
                        <img src={g.src} alt={g.t} />
                        <button
                            className="lbnav next"
                            aria-label="Next"
                            onClick={() => setLb((lb + 1) % list.length)}
                        >
                            ›
                        </button>
                        <div className="sheet-h">
                            <div>
                                <h3>{g.t}</h3>
                                {g.cap && <span className="mono muted small">{g.cap}</span>}
                            </div>
                            <span className="mono muted small">
                                {lb + 1} / {list.length}
                            </span>
                            <button className="tool" aria-label="Close" onClick={() => setLb(null)}>
                                ✕
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {toast && <div className="toast in">{toast}</div>}
        </div>
    );
}
