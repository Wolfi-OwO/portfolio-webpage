import { usePageMeta } from '../../hooks/usePageMeta.js';
import { useApiList } from '../../hooks/useApiList.js';
import { isAdmin } from '../../utils/auth.js';
import { fmtYear } from '../../utils/format-year.js';
import CareerAdminPage from './career-admin-page.jsx';

export default function CareerPage() {
    return isAdmin() ? <CareerAdminPage /> : <CareerView />;
}

function CareerView() {
    usePageMeta(
        'Career',
        'Work experience and education of Wolfi, a freelance full-stack developer from Villach, Austria.',
    );
    const [entries] = useApiList('/api/availability?track=career');
    const sorted = entries
        .filter((e) => e.published)
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    const part = (kind) => sorted.filter((e) => e.kind === kind);
    const Row = ({ e }) => (
        <div className={`crow k-${e.kind}`}>
            <span className="mono muted when">
                {fmtYear(e.startDate)} — {fmtYear(e.endDate)}
            </span>
            <div>
                <b>{e.title}</b>
                <span className="org">
                    {e.organisation}
                    {e.location ? ` · ${e.location.split(',')[0]}` : ''}
                </span>
                {e.description && <p>{e.description}</p>}
                {e.tags?.length > 0 && (
                    <div className="tags">
                        {e.tags.map((t) => (
                            <span className="tag" key={t.tech}>
                                {t.tech}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
    return (
        <div className="pw">
            <div className="page" style={{ padding: 0, maxWidth: 1040 }}>
                <header className="page-h">
                    <span className="kicker mono">Career & education</span>
                    <h1>
                        A short, <em>honest</em> CV
                    </h1>
                </header>
                <section>
                    <h2 className="sec-label">
                        <span className="sec-n">01</span>Work
                    </h2>
                    <div className="career">
                        {part('work').map((e) => (
                            <Row key={e._id} e={e} />
                        ))}
                    </div>
                </section>
                <section>
                    <h2 className="sec-label">
                        <span className="sec-n">02</span>Education
                    </h2>
                    <div className="career">
                        {part('education').map((e) => (
                            <Row key={e._id} e={e} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
