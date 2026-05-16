const highlights = [
    {
        title: 'Web Apps',
        description: 'Modern, responsive user interfaces built with React, Vite, and Tailwind CSS.',
    },
    {
        title: 'Backend APIs',
        description: 'Clean server logic and fast endpoints for projects, data handling, and integrations.',
    },
    {
        title: 'Portfolio Design',
        description: 'A personal brand experience that showcases your skills, work, and story clearly.',
    },
];

export default function Homepage() {
    return (
        <div className="space-y-14 py-12 lg:py-16">
            <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <div className="max-w-2xl space-y-6">
                    <p className="inline-flex rounded-full bg-slate-100 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        Hi, I'm Phillip
                    </p>
                    <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                        I build polished web experiences for modern brands.
                    </h1>
                    <p className="max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
                        I create clean, accessible websites and applications with fast frontends, thoughtful layouts,
                        and reliable backend APIs. This portfolio is designed to show what I build, how I think, and why
                        my work feels sharp.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <a
                            href="#projects"
                            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                            See my projects
                        </a>
                        <a
                            href="#contact"
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                        >
                            Let’s connect
                        </a>
                    </div>
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-8 shadow-xl shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/20">
                    <div className="space-y-5">
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                            Featured snapshot
                        </p>
                        <div className="rounded-3xl bg-white p-7 text-slate-950 shadow-2xl shadow-slate-200/60 dark:bg-slate-950 dark:text-white dark:shadow-slate-950/20">
                            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Portfolio overview</p>
                            <h2 className="mt-4 text-2xl font-semibold leading-tight">
                                Swift, intelligent web products that feel effortless.
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                Whether it's a landing page, dashboard, or API-powered service, I deliver projects that
                                are fast, readable, and built to grow.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-10 dark:border-slate-800 dark:bg-slate-950">
                    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                        <div>
                            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                About me
                            </p>
                            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                                A developer who enjoys clean structure, smart interactions, and meaningful results.
                            </h2>
                            <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
                                I build applications that look great and behave beautifully. My work focuses on fast
                                loading experiences, readable code, and interfaces that feel intuitive from the first
                                click.
                            </p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                    Focus
                                </p>
                                <p className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">
                                    Intuitive UI
                                </p>
                            </div>
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                    Strength
                                </p>
                                <p className="mt-3 text-xl font-semibold text-slate-950 dark:text-white">
                                    Reliable code
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
                            key={item.title}
                            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700"
                        >
                            <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{item.title}</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {item.description}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            <section id="contact" className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-14">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                        Let's build something astonishing
                    </p>
                    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                        Interested in working together?
                    </h2>
                    <p className="mt-4 max-w-2xl mx-auto text-base leading-8 text-slate-600 dark:text-slate-300">
                        I'm always open to discussing new ideas, startups, or collaborations. Reach out and let's make
                        your next web project stand out.
                    </p>
                    <a
                        href="mailto:koflerphillip@outlook.com"
                        className="mt-8 inline-flex rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                        Email me
                    </a>
                </div>
            </section>
        </div>
    );
}
