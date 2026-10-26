import { useIntl } from 'react-intl';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { useApiList } from '../../hooks/useApiList.js';
import { isAdmin } from '../../utils/auth.js';
import CareerChart from '../../components/career-chart.jsx';
import CareerAdminPage from './career-admin-page.jsx';

export default function CareerPage() {
    return isAdmin() ? <CareerAdminPage /> : <CareerView />;
}

const monthYear = (iso, loc) =>
    new Intl.DateTimeFormat(loc, { month: 'short', year: 'numeric' }).format(new Date(iso));

function range(e, loc) {
    const from = monthYear(e.startDate, loc);
    if (!e.endDate) return `${from} — ${loc.startsWith('de') ? 'heute' : 'now'}`;
    const to = monthYear(e.endDate, loc);
    return from === to ? from : `${from} — ${to}`;
}

function Column({ title, items, loc }) {
    return (
        <section className="cp-col">
            <h2>{title}</h2>
            {items.map((e) => (
                <article className="cp-item" key={e._id}>
                    <span className="mono muted cp-when">{range(e, loc)}</span>
                    <h3>{e.title}</h3>
                    <p className="cp-org">
                        {e.organisation}
                        {e.location ? ` · ${e.location.split(',')[0]}` : ''}
                    </p>
                    {e.description && <p className="cp-desc">{e.description}</p>}
                </article>
            ))}
        </section>
    );
}

function CareerView() {
    usePageMeta(
        'Career',
        'Work experience and education of Wolfi, a freelance full-stack developer from Villach, Austria.',
    );
    const { locale } = useIntl();
    const loc = locale.startsWith('de') ? 'de-AT' : 'en-GB';
    const [entries] = useApiList('/api/availability?track=career');
    const published = entries.filter((e) => e.published);
    const newest = (a, b) => new Date(b.startDate) - new Date(a.startDate);
    const work = published.filter((e) => e.kind !== 'education').sort(newest);
    const school = published.filter((e) => e.kind === 'education').sort(newest);
    const current = published.filter((e) => !e.endDate).sort(newest)[0];
    const since = published.length
        ? Math.min(...published.map((e) => new Date(e.startDate).getFullYear()))
        : null;
    return (
        <div className="pw">
            <div className="page cp-page" style={{ padding: 0, maxWidth: 1040 }}>
                <header className="page-h">
                    <span className="kicker mono">Career</span>
                    <h1>
                        Where I've <em>been</em>
                    </h1>
                    <p className="lead">
                        School, an HTL diploma in IT and summer placements at Infineon, drawn on one
                        timeline. Hover a line to see which station it is.
                    </p>
                </header>
                {published.length > 0 && (
                    <div className="cp-stats">
                        <div>
                            <b>{since}</b>
                            <span>first station</span>
                        </div>
                        <div>
                            <b>{work.length}</b>
                            <span>work stations</span>
                        </div>
                        <div>
                            <b>{school.length}</b>
                            <span>schools</span>
                        </div>
                        {current && (
                            <div>
                                <b>{current.title}</b>
                                <span>{current.organisation}, now</span>
                            </div>
                        )}
                    </div>
                )}
                <CareerChart entries={published} />
                <div className="cp-cols">
                    <Column title="Work" items={work} loc={loc} />
                    <Column title="Education" items={school} loc={loc} />
                </div>
            </div>
        </div>
    );
}
