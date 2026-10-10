import { useEffect, useState } from 'react';
import '../proto.css';

// Time runs downward, newest on top. Schools are tall bars from their first to their last day; jobs and internships
// sit inside that span, at the dates they actually happened, each with the organisation's logo.
// Phones get more height per month because their narrower cards wrap onto more lines.
const SCALE = { wide: { px: 11, min: 100 }, narrow: { px: 16, min: 150 } };
const useNarrow = () => {
    const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 640px)').matches);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)');
        const on = () => setNarrow(mq.matches);
        mq.addEventListener('change', on);
        return () => mq.removeEventListener('change', on);
    }, []);
    return narrow;
};
const LOGOS = [
    [/infineon/i, '/logos/infineon.png'],
    [/htl villach/i, '/logos/htl-villach.png'],
    [/perau/i, '/logos/perau.png'],
];
const logoFor = (org = '') => LOGOS.find(([re]) => re.test(org))?.[1];
const months = (d) => {
    const x = new Date(d);
    return x.getFullYear() * 12 + x.getMonth();
};
const span = (a, z) => {
    const x = fmt(a);
    const y = z ? fmt(z) : 'now';
    return x === y ? x : `${x} — ${y}`;
};
const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
const initials = (s = '') =>
    s
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

function Logo({ org }) {
    const src = logoFor(org);
    return (
        <span className="cc-logo" title={org}>
            {src ? <img src={src} alt={org} loading="lazy" /> : <b>{initials(org)}</b>}
        </span>
    );
}

function Side({ list, side, y, px }) {
    return (
        <div className={`cc-lane cc-${side}`}>
            {list.map((r) => {
                const lineTop = y(r.z);
                const lineH = Math.max((r.z - r.a) * px, 8);
                return (
                    <article
                        key={r._id}
                        role="listitem"
                        className={`cc-entry ${r.kind === 'education' ? 'edu' : 'job'}`}
                    >
                        <i
                            className="cc-line"
                            style={{ top: lineTop, height: lineH }}
                            aria-hidden="true"
                        />
                        <div className="cc-card" style={{ top: lineTop + lineH / 2 }}>
                            <Logo org={r.organisation} />
                            <div>
                                <span className="mono cc-kind">
                                    {r.kind === 'education'
                                        ? 'Education'
                                        : r.endDate
                                          ? 'Work'
                                          : 'Work · current'}
                                </span>
                                <b>{r.title}</b>
                                <span className="org">{r.organisation}</span>
                                <span className="mono muted when">
                                    {span(r.startDate, r.endDate)}
                                </span>
                                {r.description && r.kind === 'education' && <p>{r.description}</p>}
                            </div>
                        </div>
                    </article>
                );
            })}
        </div>
    );
}

export default function CareerChart({ entries }) {
    const { px: PX_PER_MONTH } = SCALE[useNarrow() ? 'narrow' : 'wide'];
    const now = months(new Date());
    const rows = entries.map((e) => ({
        ...e,
        a: months(e.startDate),
        z: e.endDate ? months(e.endDate) + 1 : now + 1,
    }));
    if (!rows.length) return null;
    const top = Math.max(...rows.map((r) => r.z));
    const bottom = Math.min(...rows.map((r) => r.a));
    const height = (top - bottom) * PX_PER_MONTH + 24;
    const y = (m) => (top - m) * PX_PER_MONTH + 12;
    const years = [];
    for (let m = Math.ceil(bottom / 12) * 12; m <= top; m += 12) years.push(m);
    const edu = rows.filter((r) => r.kind === 'education');
    const work = rows.filter((r) => r.kind !== 'education');

    return (
        <div className="cc" style={{ height }} role="list" aria-label="Career timeline">
            <Side list={work} side="work" y={y} px={PX_PER_MONTH} />
            <div className="cc-axis" aria-hidden="true">
                {years.map((m) => (
                    <span key={m} style={{ top: y(m) - 8 }}>
                        {m / 12}
                    </span>
                ))}
            </div>
            <Side list={edu} side="edu" y={y} px={PX_PER_MONTH} />
        </div>
    );
}
