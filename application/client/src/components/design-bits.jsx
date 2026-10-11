import '../proto.css';

import { SHOTS } from './project-layout.js';

export const Lines = ({ lines }) => (
    <h1>
        {lines.map((l, i) => (
            <span className="ln" key={i}>
                <span style={{ '--d': `${i * 110}ms` }}>{l}</span>
            </span>
        ))}
    </h1>
);

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
