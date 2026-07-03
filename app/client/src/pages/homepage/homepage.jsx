import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { usePageMeta } from '../../hooks/usePageMeta.js';

const highlights = [
    {
        titleId: 'homepage.highlightFrontendTitle',
        defaultTitle: 'Frontend Engineering',
        descriptionId: 'homepage.highlightFrontendDescription',
        defaultDescription:
            'Building fast, modern interfaces with React, Tailwind CSS, and scalable component systems.',
    },
    {
        titleId: 'homepage.highlightBackendTitle',
        defaultTitle: 'Backend Development',
        descriptionId: 'homepage.highlightBackendDescription',
        defaultDescription:
            'Designing reliable APIs, authentication systems, and performant backend architectures.',
    },
    {
        titleId: 'homepage.highlightUxTitle',
        defaultTitle: 'UI / UX Thinking',
        descriptionId: 'homepage.highlightUxDescription',
        defaultDescription:
            'Creating interfaces that feel intuitive, polished, and visually balanced across devices.',
    },
];

export default function Homepage() {
    usePageMeta(
        'Fullstack & AI-Powered Web Development',
        'Woofi Developments builds modern, AI-powered web applications with React, Node.js, and cloud technologies - fullstack software development based in Carinthia, Austria.',
    );

    return (
        <div className="space-y-20 py-10 lg:py-14">
            <section className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-2 lg:items-center lg:px-8">
                <div className="space-y-7">
                    <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-1 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        <FormattedMessage id="homepage.badge" defaultMessage="Software Engineer • Portfolio" />
                    </div>

                    <div className="space-y-5">
                        <h1 className="text-5xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-6xl">
                            <FormattedMessage id="homepage.heroTitle" defaultMessage="Hi, I'm Phillip." />
                        </h1>

                        <p className="max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                            <FormattedMessage
                                id="homepage.heroSubtitle"
                                defaultMessage="I design and develop modern, AI-powered web applications with a strong focus on clean architecture, polished UI, and performant user experiences."
                            />
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <Link
                            to="/projects"
                            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                            <FormattedMessage id="homepage.viewProjects" defaultMessage="View Projects" />
                        </Link>

                        <Link
                            to="/contact"
                            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                        >
                            <FormattedMessage id="homepage.contactMe" defaultMessage="Contact Me" />
                        </Link>
                    </div>

                    <div className="flex gap-8 pt-4">
                        <div>
                            <p className="text-3xl font-bold text-slate-950 dark:text-white">
                                <FormattedMessage id="homepage.statsProjectsValue" defaultMessage="10+" />
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                <FormattedMessage id="homepage.statsProjectsLabel" defaultMessage="Projects" />
                            </p>
                        </div>

                        <div>
                            <p className="text-3xl font-bold text-slate-950 dark:text-white">
                                <FormattedMessage id="homepage.statsStackValue" defaultMessage="React" />
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                <FormattedMessage id="homepage.statsStackLabel" defaultMessage="Main Stack" />
                            </p>
                        </div>

                        <div>
                            <p className="text-3xl font-bold text-slate-950 dark:text-white">
                                <FormattedMessage id="homepage.statsDevValue" defaultMessage="Fullstack" />
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                <FormattedMessage id="homepage.statsDevLabel" defaultMessage="Development" />
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative mx-auto w-fit max-w-md">
                    <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-slate-200 to-slate-100 blur-3xl dark:from-slate-800 dark:to-slate-900" />

                    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <img
                            src="/profile-image.jpg"
                            alt="Phillip portrait placeholder"
                            width="800"
                            height="1067"
                            fetchPriority="high"
                            className="w-96 object-cover"
                        />
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                        <div>
                            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                <FormattedMessage id="homepage.aboutLabel" defaultMessage="About Me" />
                            </p>

                            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                                <FormattedMessage
                                    id="homepage.aboutTitle"
                                    defaultMessage="Building modern digital products with clean structure and refined user experience."
                                />
                            </h2>

                            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
                                <FormattedMessage
                                    id="homepage.aboutText"
                                    defaultMessage="My focus is on developing applications that are visually polished, technically scalable, and intuitive to use. I enjoy transforming ideas into performant products with thoughtful design and maintainable code."
                                />
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Frontend</p>

                                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">React & UI</p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Backend</p>

                                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                                    APIs & Logic
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Focus</p>

                                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                                    Performance
                                </p>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Style</p>

                                <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
                                    Minimal Design
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="grid gap-6 md:grid-cols-3">
                    {highlights.map(item => (
                        <article
                            key={item.titleId}
                            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                        >
                            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
                                <FormattedMessage id={item.titleId} defaultMessage={item.defaultTitle} />
                            </h3>

                            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                <FormattedMessage id={item.descriptionId} defaultMessage={item.defaultDescription} />
                            </p>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
