import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

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

export function ProjectCard({ p, tech, span, lead = false, maxTags = MAX_TAGS, actions = null }) {
    const intl = useIntl();
    const shot = SHOTS[p.title];
    const names = (p.technologies || []).map((id) => tech[id]).filter(Boolean);
    const [open, setOpen] = useState(false);
    const rest = names.slice(maxTags);
    const shown = open ? names : names.slice(0, maxTags);
    return (
        <article
            className={`card proj ${shot ? 'has-shot' : 'plain'} ${lead ? 'lead-card' : ''}`}
            style={span ? { '--span': span } : undefined}
        >
            {/* Only front-end projects get an image: a placeholder on a CLI tool or an
                API would be decoration with nothing behind it. */}
            {shot && (
                <div className="pshot">
                    <img
                        src={shot}
                        alt={intl.formatMessage(
                            shot.endsWith('.svg')
                                ? { id: 'project.coverAlt', defaultMessage: 'Cover of {title}' }
                                : {
                                      id: 'project.screenshotAlt',
                                      defaultMessage: 'Screenshot of {title}',
                                  },
                            { title: p.title },
                        )}
                        loading="lazy"
                    />
                </div>
            )}
            <div className="pbody">
                {actions && <div className="pactions">{actions}</div>}
                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <div className="tags">
                    {shown.map((n) => (
                        <span className="tag" key={n}>
                            {n}
                        </span>
                    ))}
                    {rest.length > 0 && (
                        <button
                            type="button"
                            className="tag more"
                            aria-expanded={open}
                            title={open ? undefined : rest.join(', ')}
                            onClick={() => setOpen((v) => !v)}
                        >
                            {open ? (
                                <FormattedMessage id="project.less" defaultMessage="Less" />
                            ) : (
                                `+${rest.length}`
                            )}
                        </button>
                    )}
                </div>
                <div className="links">
                    {p.livedemo && (
                        <a className="btn sm" href={p.livedemo} target="_blank" rel="noreferrer">
                            <FormattedMessage id="project.liveDemo" defaultMessage="Live demo" />{' '}
                            <span>↗</span>
                        </a>
                    )}
                    {p.repositoryUrl && (
                        <a
                            className="btn sm ghost"
                            href={p.repositoryUrl}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <FormattedMessage id="project.repository" defaultMessage="Repository" />{' '}
                            <span>↗</span>
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
