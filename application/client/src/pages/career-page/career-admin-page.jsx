import { FormattedMessage, useIntl } from 'react-intl';
import CareerTimeline from '../../components/career-timeline.jsx';
import CareerChart from '../../components/career-chart.jsx';
import { useApiList } from '../../hooks/useApiList.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';

export default function CareerAdminPage() {
    const intl = useIntl();
    const [entries] = useApiList('/api/availability?track=career');

    // usePageMeta takes plain strings, so the localised title and description
    // are resolved here; otherwise the German locale would get an English tab title.
    usePageMeta(
        intl.formatMessage({ id: 'career.meta.title', defaultMessage: 'Career' }),
        intl.formatMessage({
            id: 'career.meta.description',
            defaultMessage:
                'Work experience and education of Wolfi, a freelance full-stack developer from Villach, Austria.',
        }),
    );

    // Admins see exactly what visitors see, then the editor below it; before this the admin view kept the old list and the new chart
    // looked "not deployed" to the one person who is always signed in.
    return (
        <div className="mx-auto max-w-5xl">
            <h1 className="sr-only">
                <FormattedMessage id="career.heading" defaultMessage="Career & Education" />
            </h1>
            <div className="pw">
                <CareerChart entries={entries.filter((e) => e.published)} />
            </div>
            <details className="mt-8">
                <summary className="cursor-pointer text-lg font-bold text-[var(--text)]">
                    <FormattedMessage id="career.admin.edit" defaultMessage="Edit entries" />
                </summary>
                {/* No props: the timeline fetches its own entries when mounted standalone, and keeps its admin create/edit forms. */}
                <CareerTimeline />
            </details>
        </div>
    );
}
