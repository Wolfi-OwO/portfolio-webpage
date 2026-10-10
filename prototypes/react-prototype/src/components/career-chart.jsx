// Time runs right to left: today is at the left edge, the oldest station at the right. Every station, school or job, is a thin line from its
// first to its last month with logo and text hanging under its newer end. YEAR_PX is generous on purpose: a one-month internship still gets a
// visible stub. Labels that would overlap an earlier one in the same lane drop to the next row.
const YEAR_PX = 264;
const PAD = 28;
const LABEL_W = { education: 440, work: 250 };
const ROW_H = { education: 96, work: 66 };
const LOGOS = [
    [/infineon/i, `${import.meta.env.BASE_URL}logos/infineon.png`],
    [/bundesheer/i, `${import.meta.env.BASE_URL}logos/bundesheer.png`],
    [/htl villach/i, `${import.meta.env.BASE_URL}logos/htl-villach.png`],
    [/perau/i, `${import.meta.env.BASE_URL}logos/perau.png`],
];
const logoFor = (org = '') => LOGOS.find(([re]) => re.test(org))?.[1];
const months = (d) => {
    const x = new Date(d);
    return x.getFullYear() * 12 + x.getMonth();
};
const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
const span = (a, z) => {
    const x = fmt(a);
    const y = z ? fmt(lastDay(z)) : 'now';
    return x === y ? x : `${x} — ${y}`;
};
// A stay covers its start month and every month up to the day before endDate: 2026-07-01 -> 2026-10-01 is July, August, September.
const lastDay = (d) => (d ? new Date(new Date(d).getTime() - 864e5) : null);
const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
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

function Lane({ kind, items, x, px }) {
    const w = LABEL_W[kind];
    const step = ROW_H[kind];
    const rightEdges = [];
    const placed = [...items]
        .sort((p, q) => q.a - p.a)
        .map((r) => {
            const left = x(r.z);
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
                <article key={r._id} role="listitem" className="ch-item">
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
                            <span className="mono when">{span(r.startDate, r.endDate)}</span>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}

export default function CareerChart({ entries }) {
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
    // Mirrored: the boundary of month m sits (last - m) months from the left edge.
    const x = (m) => PAD + (last - m) * px;
    const width = x(first) + PAD + LABEL_W.education;
    const years = [];
    for (let m = Math.ceil(first / 12) * 12; m <= last; m += 12) years.push(m);
    const edu = rows.filter((r) => r.kind === 'education');
    const work = rows.filter((r) => r.kind !== 'education');

    return (
        <div className="ch" role="list" aria-label="Career timeline">
            <div className="ch-scroll" tabIndex={0}>
                <div className="ch-inner" style={{ width }}>
                    <div className="ch-years" aria-hidden="true">
                        {years.map((m) => (
                            <span
                                key={m}
                                className="ch-year"
                                style={{ left: Math.max(x(m + 12), PAD) }}
                            >
                                {m / 12}
                            </span>
                        ))}
                        {Array.from({ length: last - first }, (_, i) => first + i).map((m) => (
                            <em
                                key={m}
                                className={m % 12 === 0 ? 'ch-m ch-m-year' : 'ch-m'}
                                style={{ left: x(m + 1), width: px }}
                            >
                                {MONTH_LETTERS[((m % 12) + 12) % 12]}
                            </em>
                        ))}
                    </div>
                    {years.map((m) => (
                        <i key={m} className="ch-grid" style={{ left: x(m) }} aria-hidden="true" />
                    ))}
                    <Lane kind="education" items={edu} x={x} px={px} />
                    <Lane kind="work" items={work} x={x} px={px} />
                </div>
            </div>
        </div>
    );
}
