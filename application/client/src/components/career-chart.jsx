import { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import '../proto.css';

// Time runs left to right: the oldest station is at the left edge, today at the right. Every station, school or job, is a thin line from its
// first to its last month with logo and text hanging under its older (left) end. YEAR_PX is generous on purpose: a one-month internship still gets a
// visible stub. Labels that would overlap an earlier one in the same lane drop to the next row.
const YEAR_PX = 336;
const PAD = 28;
const FUTURE_MONTHS = 12;
const LABEL_W = { education: 440, work: 250 };
const ROW_H = { education: 96, work: 66 };
const LOGOS = [
    [/infineon/i, '/logos/infineon.png'],
    [/bundesheer/i, '/logos/bundesheer.png'],
    [/htl villach/i, '/logos/htl-villach.png'],
    [/perau/i, '/logos/perau.png'],
];
const logoFor = (org = '') => LOGOS.find(([re]) => re.test(org))?.[1];
const months = (d) => {
    const x = new Date(d);
    return x.getFullYear() * 12 + x.getMonth();
};
// English reads as British, German as Austrian (de-AT: Jänner, Sept.), whatever the browser locale is.
const dateLocale = (loc) => (loc.startsWith('de') ? 'de-AT' : 'en-GB');
const fmt = (d, loc) =>
    new Date(d).toLocaleDateString(dateLocale(loc), { month: 'short', year: 'numeric' });
const span = (a, z, loc) => {
    const x = fmt(a, loc);
    const y = z ? fmt(lastDay(z), loc) : loc.startsWith('de') ? 'heute' : 'now';
    return x === y ? x : `${x} — ${y}`;
};
// A stay covers its start month and every month up to the day before endDate: 2026-07-01 -> 2026-10-01 is July, August, September.
const lastDay = (d) => (d ? new Date(new Date(d).getTime() - 864e5) : null);
// Three letters per month on the axis, Austrian German says Jän (not Jan) and Mär; cells are 22px wide, which fits three letters of the mono font.
const MONTHS = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    de: ['Jän', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
};
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
        <span className="ch-logo" title={org}>
            {src ? <img src={src} alt={org} loading="lazy" /> : <b>{initials(org)}</b>}
        </span>
    );
}

function Lane({ kind, items, x, px, locale, admin, onEdit, onDelete }) {
    const w = LABEL_W[kind];
    const step = ROW_H[kind];
    const rightEdges = [];
    const placed = [...items]
        .sort((p, q) => p.a - q.a)
        .map((r) => {
            const left = x(r.a);
            let lane = rightEdges.findIndex((edge) => left >= edge);
            if (lane === -1) lane = rightEdges.length;
            rightEdges[lane] = left + w + 8;
            return { ...r, left, lane };
        });
    const lanes = Math.max(1, rightEdges.length);
    return (
        <div className={`ch-lane ch-${kind}`} style={{ height: 18 + lanes * step }}>
            {placed.map((r) => (
                // display: contents keeps line and label siblings of the lane, so both can be absolutely placed yet hover as one station
                <article
                    key={r._id}
                    role="listitem"
                    className={r.published === false ? 'ch-item ch-draft' : 'ch-item'}
                >
                    <i
                        className="ch-line"
                        style={{ left: r.left, width: Math.max((r.z - r.a) * px, 10) }}
                    />
                    <div
                        className="ch-lab"
                        tabIndex={0}
                        style={{ left: r.left, top: 18 + r.lane * step, width: w }}
                    >
                        <Logo org={r.organisation} />
                        <div>
                            <b>{r.title}</b>
                            <span className="org">{r.organisation}</span>
                            <span className="mono when">
                                {span(r.startDate, r.endDate, locale)}
                            </span>
                        </div>
                        {admin && (
                            <span className="ch-act">
                                <button
                                    type="button"
                                    aria-label={`Edit ${r.title}`}
                                    onClick={() => onEdit(r)}
                                >
                                    <PencilSquareIcon />
                                </button>
                                <button
                                    type="button"
                                    aria-label={`Delete ${r.title}`}
                                    onClick={() => onDelete(r)}
                                >
                                    <TrashIcon />
                                </button>
                            </span>
                        )}
                    </div>
                </article>
            ))}
        </div>
    );
}

export default function CareerChart({ entries, admin = false, onEdit, onDelete }) {
    const { locale } = useIntl();
    const scroller = useRef(null);
    // The chart opens with today about three quarters across, so the empty year ahead peeks in without hiding the newest stations.
    useEffect(() => {
        const el = scroller.current;
        if (el) el.scrollLeft = Number(el.dataset.now) - el.clientWidth * 0.75;
    }, [entries]);
    const now = months(new Date());
    const rows = entries.map((e) => ({
        ...e,
        a: months(e.startDate),
        z: e.endDate ? months(lastDay(e.endDate)) + 1 : now + 1,
    }));
    if (!rows.length) return null;
    const first = Math.min(...rows.map((r) => r.a));
    const last = Math.max(...rows.map((r) => r.z));
    const px = YEAR_PX / 12;
    // The boundary of month m sits (m - first) months from the left edge.
    const x = (m) => PAD + (m - first) * px;
    // A year of empty axis after the newest month: nothing is planned there, the space is the point.
    const axisEnd = Math.max(last, now + 1) + FUTURE_MONTHS;
    // Labels hang to the right of their start, so the canvas ends at whichever of line end or label end reaches further.
    const width =
        Math.max(
            x(axisEnd),
            ...rows.map((r) => x(r.a) + LABEL_W[r.kind === 'education' ? 'education' : 'work']),
        ) + PAD;
    const years = [];
    for (let m = Math.ceil(first / 12) * 12; m <= axisEnd; m += 12) years.push(m);
    const edu = rows.filter((r) => r.kind === 'education');
    const work = rows.filter((r) => r.kind !== 'education');

    const laneProps = { locale, admin, onEdit, onDelete };

    return (
        <div className="ch" role="list" aria-label="Career timeline">
            <div className="ch-scroll" tabIndex={0} ref={scroller} data-now={x(now + 1)}>
                <div className="ch-inner" style={{ width }}>
                    <div className="ch-years" aria-hidden="true">
                        {years.map((m) => (
                            <span key={m} className="ch-year" style={{ left: x(m) }}>
                                {m / 12}
                            </span>
                        ))}
                        {Array.from({ length: axisEnd - first }, (_, i) => first + i).map((m) => (
                            <em
                                key={m}
                                className={m % 12 === 0 ? 'ch-m ch-m-year' : 'ch-m'}
                                style={{ left: x(m), width: px }}
                            >
                                {
                                    MONTHS[locale.startsWith('de') ? 'de' : 'en'][
                                        ((m % 12) + 12) % 12
                                    ]
                                }
                            </em>
                        ))}
                    </div>
                    {years.map((m) => (
                        <i key={m} className="ch-grid" style={{ left: x(m) }} aria-hidden="true" />
                    ))}
                    <Lane kind="education" items={edu} x={x} px={px} {...laneProps} />
                    <Lane kind="work" items={work} x={x} px={px} {...laneProps} />
                </div>
            </div>
        </div>
    );
}
