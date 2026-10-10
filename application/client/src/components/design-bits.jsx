import '../proto.css';

const SHOTS = {
    NetViz: '/shots/netviz.png',
    Metrion: '/shots/metrion.png',
    Nutrilens: '/shots/nutrilens.png',
    'Machine Learning Visualizer': '/shots/ml.png',
};
export const Lines = ({ lines }) => (
    <h1>
        {lines.map((l, i) => (
            <span className="ln" key={i}>
                <span style={{ '--d': `${i * 110}ms` }}>{l}</span>
            </span>
        ))}
    </h1>
);

export const hasShot = (p) => Boolean(SHOTS[p.title]);

// Rows always add up to 12 columns, so each row ends flush on the right while the
// cards inside it differ in width, the way a justified photo wall does. Two per row
// alternate 7+5 / 5+7, three share the row evenly, and a leftover single card is
// folded into the previous row rather than left stranded at full width.
export function rowSpans(count) {
    const spans = [];
    let left = count;
    let flip = false;
    while (left > 0) {
        if (left === 3 || left === 1) {
            const n = left === 1 ? 1 : 3;
            spans.push(...Array(n).fill(12 / n));
            left -= n;
        } else {
            spans.push(...(flip ? [5, 7] : [7, 5]));
            flip = !flip;
            left -= 2;
        }
    }
    return spans;
}

const MAX_TAGS = 4;

export function ProjectCard({ p, tech, span, lead = false }) {
    const shot = SHOTS[p.title];
    const names = (p.technologies || []).map((id) => tech[id]).filter(Boolean);
    const rest = names.slice(MAX_TAGS);
    return (
        <article
            className={`card proj ${shot ? 'has-shot' : 'plain'} ${lead ? 'lead-card' : ''}`}
            style={span ? { '--span': span } : undefined}
        >
            {/* Only front-end projects get an image: a placeholder on a CLI tool or an
                API would be decoration with nothing behind it. */}
            {shot && (
                <div className="pshot">
                    <img src={shot} alt={`Screenshot of ${p.title}`} loading="lazy" />
                </div>
            )}
            <div className="pbody">
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <div className="tags">
                    {names.slice(0, MAX_TAGS).map((n) => (
                        <span className="tag" key={n}>
                            {n}
                        </span>
                    ))}
                    {rest.length > 0 && (
                        <span className="tag more" title={rest.join(', ')}>
                            +{rest.length}
                        </span>
                    )}
                </div>
                <div className="links">
                    {p.livedemo && (
                        <a className="btn sm" href={p.livedemo} target="_blank" rel="noreferrer">
                            Live demo <span>↗</span>
                        </a>
                    )}
                    {p.repositoryUrl && (
                        <a
                            className="btn sm ghost"
                            href={p.repositoryUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Repository <span>↗</span>
                        </a>
                    )}
                </div>
            </div>
        </article>
    );
}

export const Icon = ({ d, size = 22 }) => (
    <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d={d} />
    </svg>
);
