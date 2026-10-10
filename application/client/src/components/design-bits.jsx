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

export function ProjectCard({ p, tech }) {
    const host = p.livedemo ? p.livedemo.replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
    return (
        <article className="card proj">
            <div className={`shot ${SHOTS[p.title] ? '' : 'ph2'}`}>
                <div className="chrome">
                    <i />
                    <i />
                    <i />
                    <span>{host || 'repository only'}</span>
                </div>
                {SHOTS[p.title] ? (
                    <img src={SHOTS[p.title]} alt={`Screenshot of ${p.title}`} loading="lazy" />
                ) : (
                    <div className="ph2-body">
                        <b>
                            {p.title
                                .split(' ')
                                .map((w) => w[0])
                                .join('')
                                .slice(0, 3)}
                        </b>
                    </div>
                )}
            </div>
            <h3>{p.title}</h3>
            <p>{p.description}</p>
            <div className="tags">
                {(p.technologies || []).map(
                    (id) =>
                        tech[id] && (
                            <span className="tag" key={id}>
                                {tech[id]}
                            </span>
                        ),
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
