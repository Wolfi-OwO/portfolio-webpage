import '../proto.css';

// Time runs right to left: today is at the left edge, the oldest station at the right. Schools are long bars from their first to their last day; jobs and internships are bars of
// their real length with a pin and card below, so overlaps with school are visible. YEAR_PX is generous on purpose:
// a one-month internship still gets a readable slice.
const YEAR_PX = 264;
const CARD_W = 232;
const PAD = 28;
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
const fmt = (d) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
const span = (a, z) => {
    const x = fmt(a);
    const y = z ? fmt(z) : 'now';
    return x === y ? x : `${x} — ${y}`;
};
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

export default function CareerChart({ entries }) {
    const now = months(new Date());
    const rows = entries.map((e) => ({
        ...e,
        a: months(e.startDate),
        z: e.endDate ? months(e.endDate) + 1 : now + 1,
    }));
    const first = rows.length ? Math.min(...rows.map((r) => r.a)) : 0;
    const last = rows.length ? Math.max(...rows.map((r) => r.z)) : 0;

    if (!rows.length) return null;
    const px = YEAR_PX / 12;
    // Mirrored: the boundary of month m sits (last - m) months from the left edge.
    const x = (m) => PAD + (last - m) * px;
    const width = x(last) + PAD;
    const years = [];
    for (let m = Math.ceil(first / 12) * 12; m <= last; m += 12) years.push(m);

    const edu = rows.filter((r) => r.kind === 'education');
    // Jobs: stagger the cards over levels so neighbouring cards never overlap.
    const edges = [];
    const work = rows
        .filter((r) => r.kind !== 'education')
        .sort((p, q) => q.a - p.a)
        .map((r) => {
            const mid = (x(r.a) + x(r.z)) / 2;
            let level = edges.findIndex((right) => mid - CARD_W / 2 >= right + 8);
            if (level === -1) level = edges.length;
            edges[level] = mid + CARD_W / 2;
            return { ...r, mid, level };
        });
    const levels = Math.max(1, edges.length);

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

                    <p className="ch-label mono">Education</p>
                    <div className="ch-lane ch-edu">
                        {edu.map((r) => (
                            <article
                                key={r._id}
                                role="listitem"
                                className="ch-bar"
                                style={{ left: x(r.z), width: Math.max((r.z - r.a) * px, 56) }}
                            >
                                {/* One sticky wrapper so logo and text travel together and stay readable while the bar is scrolled. */}
                                <div className="ch-bar-in">
                                    <Logo org={r.organisation} />
                                    <div>
                                        <b>{r.title}</b>
                                        <span className="org">{r.organisation}</span>
                                        <span className="mono when">
                                            {span(r.startDate, r.endDate)}
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    <p className="ch-label mono">Work</p>
                    <div className="ch-lane ch-work" style={{ height: 34 + levels * 112 }}>
                        {work.map((r) => (
                            <article key={r._id} role="listitem" className="ch-job">
                                <i
                                    className="ch-span"
                                    style={{ left: x(r.z), width: Math.max((r.z - r.a) * px, 10) }}
                                />
                                <i
                                    className="ch-stem"
                                    style={{ left: r.mid, height: 14 + r.level * 112 }}
                                />
                                <div
                                    className="ch-card"
                                    style={{
                                        left: Math.max(r.mid - CARD_W / 2, 8),
                                        width: CARD_W,
                                        top: 26 + r.level * 112,
                                    }}
                                >
                                    <Logo org={r.organisation} />
                                    <div>
                                        <span className="mono ch-kind">
                                            {r.endDate ? 'Work' : 'Work · current'}
                                        </span>
                                        <b>{r.title}</b>
                                        <span className="mono when">
                                            {span(r.startDate, r.endDate)}
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
