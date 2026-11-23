import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { Link } from '../../i18n/router-links.jsx';
import { usePublicPageMeta } from '../../hooks/usePublicPageMeta.js';
import { INDEX_COPY, studyBySlug } from '../../../../server/src/seo/case-studies.js';

export default function CaseStudyPage() {
    const { slug } = useParams();
    const study = studyBySlug(slug);
    if (!study) throw new Response('Not Found', { status: 404 });
    return <CaseStudy study={study} />;
}

function CaseStudy({ study }) {
    const { locale } = useIntl();
    usePublicPageMeta(`/case-studies/${study.slug}`);
    const copy = INDEX_COPY[locale];
    const text = study[locale];
    return (
        <div className="pw">
            <div className="page" style={{ padding: 0 }}>
                <Link className="cs-back" to="/case-studies">
                    ← {copy.back}
                </Link>
                <header className="page-h">
                    <p className="kicker">{text.kind}</p>
                    <h1>{study.name}</h1>
                    <p className="lead">{text.summary}</p>
                    <ul className="cs-stack" aria-label={copy.stack}>
                        {study.stack.map((t) => (
                            <li className="metachip big" key={t}>
                                {t}
                            </li>
                        ))}
                    </ul>
                </header>

                <section className="cs-section">
                    <h2>{copy.problem}</h2>
                    <p className="cs-prose">{text.problem}</p>
                </section>

                <section className="cs-section">
                    <h2>{copy.decisions}</h2>
                    <ol className="cs-decisions">
                        {text.decisions.map((d, i) => (
                            <li className="card" key={d.title}>
                                <span className="cs-num">{String(i + 1).padStart(2, '0')}</span>
                                <h3>{d.title}</h3>
                                <p>{d.body}</p>
                            </li>
                        ))}
                    </ol>
                </section>

                <section className="cs-section">
                    <h2>{copy.result}</h2>
                    <p className="cs-prose">{text.result}</p>
                    <div className="cs-links">
                        {study.live ? (
                            <a className="btn" href={study.live} rel="noopener">
                                {copy.live}
                            </a>
                        ) : null}
                        <a className="btn ghost" href={study.repo} rel="noopener">
                            {copy.repo}
                        </a>
                    </div>
                </section>
            </div>
        </div>
    );
}
