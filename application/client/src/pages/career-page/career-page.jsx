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
                <h1 className="sr-only">Career and education</h1>
                <CareerChart entries={published} />
            </div>
        </div>
    );
}
