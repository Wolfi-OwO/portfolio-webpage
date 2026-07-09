import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { LiveStatusLine, SocialRow } from '../../components/identity.jsx';
import { IDENTITY } from '../../utils/identity.js';

// A set, not a sequence — so no 01/02/03 numbering. The mono key is the label.
const disciplines = [
    {
        key: 'frontend',
        titleId: 'homepage.highlightFrontendTitle',
        defaultTitle: 'Frontend Engineering',
        descriptionId: 'homepage.highlightFrontendDescription',
        defaultDescription: 'Building fast, modern interfaces with React, Tailwind CSS, and scalable component systems.',
    },
    {
        key: 'backend',
        titleId: 'homepage.highlightBackendTitle',
        defaultTitle: 'Backend Development',
        descriptionId: 'homepage.highlightBackendDescription',
        defaultDescription: 'Designing reliable APIs, authentication systems, and performant backend architectures.',
    },
    {
        key: 'operations',
        titleId: 'homepage.highlightOpsTitle',
        defaultTitle: 'Running It in Production',
        descriptionId: 'homepage.highlightOpsDescription',
        defaultDescription:
            'Containers on Azure, CI/CD, and uptime monitoring — the part that starts after the code is written.',
    },
];

/** Soft accent wash behind the hero. Purely atmospheric, so it never takes focus. */
function Glow() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--glow),transparent_70%)]"
        />
    );
}

// The signature element: a profile card that is also a service card. Identity on
// top, live production telemetry at the bottom — this site reporting on itself.
function ProfileCard() {
    return (
        <article className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-7 shadow-xl shadow-black/5 sm:p-8">
            <div className="flex items-start gap-5">
                <img
                    src="/profile-image.jpg"
                    alt={`${IDENTITY.name}, portrait`}
                    width="160"
                    height="160"
                    fetchPriority="high"
                    className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-1 ring-[var(--line)] sm:h-24 sm:w-24"
                />

                <div className="min-w-0 pt-0.5">
                    <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-[var(--text)] sm:text-3xl">
                        {IDENTITY.name}
                    </h1>

                    <p className="font-mono text-sm text-[var(--muted)]">{IDENTITY.handle}</p>

                    <p className="mt-2 text-sm font-medium leading-snug text-[var(--accent)]">
                        <FormattedMessage id="homepage.role" defaultMessage="Fullstack Developer" />
                        <br />
                        <FormattedMessage id="homepage.location" defaultMessage="Carinthia, Austria" />
                    </p>
                </div>
            </div>

            <p className="mt-6 text-[15px] leading-7 text-[var(--muted)]">
                <FormattedMessage
                    id="homepage.bio"
                    defaultMessage="I build full-stack web apps — React on the front, Node and MongoDB behind it — and then actually run them on Azure Container Apps. The line below is live: it's this site reporting on its own uptime."
                />
            </p>

            <div className="mt-6">
                <SocialRow />
            </div>

            <div className="mt-6 border-t border-[var(--line)] pt-4">
                <LiveStatusLine />
            </div>
        </article>
    );
}

export default function Homepage() {
    usePageMeta(
        'Fullstack & AI-Powered Web Development',
        'Woofi Developments builds modern, AI-powered web applications with React, Node.js, and cloud technologies - fullstack software development based in Carinthia, Austria.',
    );

    return (
        <div className="relative">
            <Glow />

            <div className="relative mx-auto max-w-5xl space-y-20 px-6 py-12 lg:py-20">
                <section className="flex justify-center">
                    <ProfileCard />
                </section>

                <section className="max-w-3xl">
                    <h2 className="font-display text-5xl font-bold tracking-tight text-[var(--text)] sm:text-6xl">
                        <FormattedMessage id="homepage.heyTitle" defaultMessage="Hey!" />
                    </h2>

                    <p className="mt-6 text-lg leading-8 text-[var(--muted)]">
                        <FormattedMessage
                            id="homepage.heyText"
                            defaultMessage="Online I go by Woofi. I'm an apprentice software developer who got hooked on the whole pipeline — designing an interface, wiring up the API behind it, shipping it to the cloud, and watching whether it stays up."
                        />
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            to="/projects"
                            className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                        >
                            <FormattedMessage id="homepage.viewProjects" defaultMessage="View Projects" />
                        </Link>

                        <Link
                            to="/contact"
                            className="inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        >
                            <FormattedMessage id="homepage.contactMe" defaultMessage="Contact Me" />
                        </Link>
                    </div>
                </section>

                <section>
                    <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                        <FormattedMessage id="homepage.buildEyebrow" defaultMessage="what i build" />
                    </p>

                    <div className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-3">
                        {disciplines.map(item => (
                            <article key={item.key} className="bg-[var(--surface)] p-7">
                                <p className="font-mono text-[11px] text-[var(--accent)]">{item.key}</p>

                                <h3 className="mt-3 font-display text-lg font-semibold text-[var(--text)]">
                                    <FormattedMessage id={item.titleId} defaultMessage={item.defaultTitle} />
                                </h3>

                                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                                    <FormattedMessage id={item.descriptionId} defaultMessage={item.defaultDescription} />
                                </p>
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
