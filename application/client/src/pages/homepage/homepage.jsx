import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { SocialRow } from '../../components/identity.jsx';
import LoadingScreen from '../../components/loading-screen.jsx';
import { shouldBoot } from '../../utils/boot.js';
import { IDENTITY } from '../../utils/identity.js';

const work = [
    {
        key: 'frontend',
        titleId: 'homepage.workFrontendTitle',
        defaultTitle: 'Frontend',
        bodyId: 'homepage.workFrontendBody',
        defaultBody: 'React, Tailwind, component systems. Mostly interfaces people have to use every day.',
    },
    {
        key: 'backend',
        titleId: 'homepage.workBackendTitle',
        defaultTitle: 'Backend',
        bodyId: 'homepage.workBackendBody',
        defaultBody: 'Express and MongoDB. REST APIs, auth, and the data model underneath.',
    },
    {
        key: 'operations',
        titleId: 'homepage.workOpsTitle',
        defaultTitle: 'Operations',
        bodyId: 'homepage.workOpsBody',
        defaultBody: 'Docker images, GitHub Actions, Azure Container Apps. I run what I build.',
    },
];

export default function Homepage() {
    usePageMeta(
        'Fullstack & AI-Powered Web Development',
        'Woofi Developments builds modern, AI-powered web applications with React, Node.js, and cloud technologies - fullstack software development based in Carinthia, Austria.',
    );

    const [booting, setBooting] = useState(shouldBoot);

    return (
        <>
            {booting && <LoadingScreen onDone={() => setBooting(false)} />}

            <div className={`mx-auto max-w-2xl px-6 py-12 lg:py-16 ${booting ? '' : 'animate-fade-up'}`}>
                <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
                    <div className="flex items-start gap-5">
                        <img
                            src="/profile-image.jpg"
                            alt={`${IDENTITY.name}, portrait`}
                            width="160"
                            height="160"
                            fetchPriority="high"
                            className="h-20 w-20 shrink-0 rounded-md border border-[var(--line)] object-cover sm:h-24 sm:w-24"
                        />

                        <div className="min-w-0 pt-1">
                            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
                                {IDENTITY.name}
                            </h1>
                            <p className="font-mono text-sm text-[var(--muted)]">{IDENTITY.handle}</p>
                            <p className="mt-1.5 text-sm text-[var(--accent)]">
                                <FormattedMessage
                                    id="homepage.role"
                                    defaultMessage="Fullstack developer / Carinthia, Austria"
                                />
                            </p>
                        </div>
                    </div>

                    <p className="mt-6 leading-7 text-[var(--muted)]">
                        <FormattedMessage
                            id="homepage.bio"
                            defaultMessage="I'm a software developer from Carinthia. I graduated from HTL Villach in 2026 with a Reife- und Diplomprüfung in computer science, and I've done software engineering internships at Infineon Technologies. I write web apps with React on the front and Node behind it, put them in containers, and run them on Azure."
                        />
                    </p>

                    <div className="mt-6 border-t border-[var(--line)] pt-5">
                        <SocialRow />
                    </div>
                </section>

                <section className="mt-12">
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                        <FormattedMessage id="homepage.workTitle" defaultMessage="What I work on" />
                    </h2>

                    <dl className="mt-5">
                        {work.map(item => (
                            <div
                                key={item.key}
                                className="grid gap-1 border-b border-[var(--line)] py-4 last:border-0 sm:grid-cols-[8rem_1fr] sm:gap-6"
                            >
                                <dt className="text-sm font-medium text-[var(--text)]">
                                    <FormattedMessage id={item.titleId} defaultMessage={item.defaultTitle} />
                                </dt>
                                <dd className="text-sm leading-7 text-[var(--muted)]">
                                    <FormattedMessage id={item.bodyId} defaultMessage={item.defaultBody} />
                                </dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section className="mt-10 flex flex-wrap gap-3">
                    <Link
                        to="/projects"
                        className="rounded-md bg-[var(--text)] px-4 py-2 text-sm font-medium text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                        <FormattedMessage id="homepage.viewProjects" defaultMessage="View projects" />
                    </Link>
                    <Link
                        to="/contact"
                        className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                        <FormattedMessage id="homepage.contactMe" defaultMessage="Get in touch" />
                    </Link>
                </section>
            </div>
        </>
    );
}
