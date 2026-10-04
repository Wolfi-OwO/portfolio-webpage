import { FormattedMessage, useIntl } from 'react-intl';
import CareerTimeline from '../../components/career-timeline.jsx';
import { usePageMeta } from '../../hooks/usePageMeta.js';

export default function CareerAdminPage() {
    const intl = useIntl();

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

    return (
        <div className="mx-auto max-w-5xl">
            <h1 className="text-4xl font-extrabold text-[var(--text)]">
                <FormattedMessage id="career.heading" defaultMessage="Career & Education" />
            </h1>

            {/* No props: the timeline fetches its own published entries when mounted
                standalone, and keeps its admin create/edit forms. */}
            <CareerTimeline />
        </div>
    );
}
