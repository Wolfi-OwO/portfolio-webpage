import { useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useLocation } from 'react-router-dom';
import { usePublicPageMeta } from '../../hooks/usePublicPageMeta.js';
import { useApiList } from '../../hooks/useApiList.js';
import { localizeAll } from '../../i18n/localize.js';
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
    const intl = useIntl();
    const { locale } = intl;
    usePublicPageMeta('/career');
    const loc = locale.startsWith('de') ? 'de-AT' : 'en-GB';
    const [entries] = useApiList('/api/availability?track=career');
    const published = localizeAll(entries, locale).filter((e) => e.published);
    const newest = (a, b) => new Date(b.startDate) - new Date(a.startDate);
    const work = published.filter((e) => e.kind !== 'education').sort(newest);
    const school = published.filter((e) => e.kind === 'education').sort(newest);
    const current = published.filter((e) => !e.endDate).sort(newest)[0];
    const since = published.length
        ? Math.min(...published.map((e) => new Date(e.startDate).getFullYear()))
        : null;
    return (
        <div className="pw">
            <div className="page cp-page" style={{ padding: 0 }}>
                <header className="page-h">
                    <h1>
                        <FormattedMessage id="career.page.headline" defaultMessage="Career" />
                    </h1>
                </header>
                {published.length > 0 && (
                    <div className="cp-stats">
                        <div>
                            <b>{since}</b>
                            <span>
                                <FormattedMessage
                                    id="career.page.firstStation"
                                    defaultMessage="first station"
                                />
                            </span>
                        </div>
                        <div>
                            <b>{work.length}</b>
                            <span>
                                <FormattedMessage
                                    id="career.page.workStations"
                                    defaultMessage="work stations"
                                />
                            </span>
                        </div>
                        <div>
                            <b>{school.length}</b>
                            <span>
                                <FormattedMessage
                                    id="career.page.schools"
                                    defaultMessage="schools"
                                />
                            </span>
                        </div>
                        {current && (
                            <div>
                                <b>{current.title}</b>
                                <span>
                                    <FormattedMessage
                                        id="career.page.currentNow"
                                        defaultMessage="{organisation}, now"
                                        values={{ organisation: current.organisation }}
                                    />
                                </span>
                            </div>
                        )}
                    </div>
                )}
                <CareerChart entries={published} />
                <div className="cp-cols">
                    <Column
                        title={intl.formatMessage({
                            id: 'career.page.work',
                            defaultMessage: 'Work',
                        })}
                        items={work}
                        loc={loc}
                    />
                    <Column
                        title={intl.formatMessage({
                            id: 'career.page.education',
                            defaultMessage: 'Education',
                        })}
                        items={school}
                        loc={loc}
                    />
                </div>
                <Diplomarbeit />
            </div>
        </div>
    );
}

// The thesis for the Reife- und Diplomprüfung at HTL Villach. The PDF is German, so the card says so.
function Diplomarbeit() {
    const { hash } = useLocation();
    // The nav's "Diploma thesis" link lands here; the router does not scroll to an anchor by itself.
    useEffect(() => {
        if (hash === '#thesis')
            document.getElementById('thesis')?.scrollIntoView({ block: 'center' });
    }, [hash]);
    return (
        <section id="thesis" className="cp-thesis card" aria-labelledby="thesis-h">
            <p className="kicker">
                <FormattedMessage
                    id="career.thesis.kicker"
                    defaultMessage="Reife- und Diplomprüfung · HTL Villach · 2026"
                />
            </p>
            <h2 id="thesis-h">
                <FormattedMessage
                    id="career.thesis.title"
                    defaultMessage="Diploma thesis: migrating a web application to new technologies"
                />
            </h2>
            <p>
                <FormattedMessage
                    id="career.thesis.body"
                    defaultMessage="A web application for managing experiments, written in 2012 with PHP, jQuery and Spring Boot, was migrated to Angular 18 and ASP.NET Core during a two-month internship. The thesis covers the analysis of the old system, the design, the implementation in Scrum with PI Planning, and the rollout to several sites."
                />
            </p>
            <a
                className="btn"
                href="/documents/Kofler-Phillip_Diplomarbeit.pdf"
                target="_blank"
                rel="noopener"
            >
                <FormattedMessage
                    id="career.thesis.download"
                    defaultMessage="Read the thesis (PDF, 65 pages, in German)"
                />
            </a>
        </section>
    );
}
