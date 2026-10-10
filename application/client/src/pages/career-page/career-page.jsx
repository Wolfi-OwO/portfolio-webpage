import { usePageMeta } from '../../hooks/usePageMeta.js';
import { useApiList } from '../../hooks/useApiList.js';
import { isAdmin } from '../../utils/auth.js';
import CareerChart from '../../components/career-chart.jsx';
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
    const published = entries.filter((e) => e.published);
    return (
        <div className="pw">
            <div className="page" style={{ padding: 0, maxWidth: 1040 }}>
                <header className="page-h">
                    <span className="kicker mono">Career & education</span>
                    <h1>
                        A short, <em>honest</em> CV
                    </h1>
                    <p className="lead">
                        Each line runs from the first to the last day. Work is on the left, school
                        on the right, so you can see what happened in parallel.
                    </p>
                </header>
                <CareerChart entries={published} />
            </div>
        </div>
    );
}
