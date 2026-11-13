import { Link } from 'react-router-dom';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { useApiList } from '../../hooks/useApiList.js';
import { isAdmin } from '../../utils/auth.js';
import { Icon } from '../../components/design-bits.jsx';
import ServicesAdminPage from './services-admin-page.jsx';

const ICON = {
    web: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
    mobile: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2',
    desktop: 'M3 5h18v11H3zM8 20h8M12 16v4',
    other: 'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.2-.6-.6-2.2z',
};

export default function ServicesPage() {
    return isAdmin() ? <ServicesAdminPage /> : <ServicesView />;
}

function ServicesView() {
    usePageMeta(
        'Services',
        'What Wolfi builds: websites, web applications, Android apps and desktop software, with plain prices.',
    );
    const [services] = useApiList('/api/services');
    const shown = services
        .filter((s) => s.published !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const rate = shown[0]?.hourlyRate ?? 30;
    return (
        <div className="pw">
            <div className="page" style={{ padding: 0 }}>
                <header className="page-h">
                    <h1>
                        Services, <em>priced</em> plainly
                    </h1>
                    <p className="lead">
                        These prices are starting points. What a project costs depends on what it
                        has to do, and I can only say that after we have talked.
                    </p>
                    <div className="svc-meta">
                        <span className="metachip big">Hourly rate €{rate}</span>
                        <span className="metachip big live">
                            <i />
                            Small jobs now · larger projects from April 2027
                        </span>
                    </div>
                </header>
                <div className="svc-grid">
                    {shown.map((s) => (
                        <article className="card svc2" key={s._id}>
                            <span className="svc-ico">
                                <Icon d={ICON[s.category] || ICON.other} size={24} />
                            </span>
                            <span className="pill">{s.category}</span>
                            <h3>{s.title}</h3>
                            <p className="svc-d">{s.description}</p>
                            {s.deliverables?.length > 0 && (
                                <ul className="checks">
                                    {s.deliverables.map((d) => (
                                        <li key={d}>
                                            <Icon d="M5 12.5l4.5 4.5L19 7" size={16} />
                                            <span>{d}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            <div className="svc-foot">
                                <div className="price2">
                                    <small className="mono">
                                        {s.priceFrom ? 'starting at' : 'price'}
                                    </small>
                                    <b>{s.priceFrom ? `€${s.priceFrom}` : 'On request'}</b>
                                </div>
                                <div className="svc-chips">
                                    <span className="metachip">€{s.hourlyRate} / h</span>
                                    {s.duration && <span className="metachip">{s.duration}</span>}
                                </div>
                            </div>
                            <Link className="btn sm" to="/contact">
                                Ask about this <span>→</span>
                            </Link>
                        </article>
                    ))}
                </div>
                <p className="muted svc-note">
                    Write to me with a few lines about what the thing should do and I reply with
                    what it would take. Small jobs fit in now, bigger projects start in April 2027.{' '}
                    <Link to="/contact">Get in touch</Link>.
                </p>
            </div>
        </div>
    );
}
