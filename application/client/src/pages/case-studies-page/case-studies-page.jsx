import { useIntl } from 'react-intl';
import { Link } from '../../i18n/router-links.jsx';
import { usePublicPageMeta } from '../../hooks/usePublicPageMeta.js';
import { CASE_STUDIES, INDEX_COPY } from '../../../../server/src/seo/case-studies.js';

export default function CaseStudiesPage() {
    const { locale } = useIntl();
    usePublicPageMeta('/case-studies');
    const copy = INDEX_COPY[locale];
    return (
        <div className="pw">
            <div className="page cs-page" style={{ padding: 0 }}>
                <header className="page-h">
                    <h1>{copy.h1}</h1>
                    <p className="lead">{copy.lead}</p>
                </header>
                <div className="cs-grid">
                    {CASE_STUDIES.map((s) => (
                        <article className="card cs-card" key={s.slug}>
                            <p className="kicker">{s[locale].kind}</p>
                            <h2>{s.name}</h2>
                            <p>{s[locale].summary}</p>
                            <ul className="cs-stack" aria-label={copy.stack}>
                                {s.stack.slice(0, 4).map((t) => (
                                    <li className="metachip" key={t}>
                                        {t}
                                    </li>
                                ))}
                            </ul>
                            <Link className="btn" to={`/case-studies/${s.slug}`}>
                                {copy.read}
                            </Link>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
