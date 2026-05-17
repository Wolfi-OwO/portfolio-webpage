const highlights = [
    {
        title: 'Frontend Engineering',
        description: 'Building fast, modern interfaces with React, Tailwind CSS, and scalable component systems.',
    },
    {
        title: 'Backend Development',
        description: 'Designing reliable APIs, authentication systems, and performant backend architectures.',
    },
    {
        title: 'UI / UX Thinking',
        description: 'Creating interfaces that feel intuitive, polished, and visually balanced across devices.',
    },
];

export default function Homepage() {
    return (
        <div className="space-y-20 py-10 lg:py-14">
            <section className="mx-auto grid max-w-6xl gap-14 px-6 lg:grid-cols-2 lg:items-center lg:px-8">
                <div className="space-y-7">
                    <div className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-1 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                        Software Engineer • Portfolio
                    </div>

                    <div className="space-y-5">
                        <h1 className="text-5xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-6xl">
                            Hi, I'm Phillip.
                        </h1>

                        <p className="max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                            I design and develop modern web applications with a strong focus on clean architecture,
                            polished UI, and performant user experiences.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <a
                            href="#projects"
                            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                            View Projects
                        </a>

                        <a
                            href="#contact"
                            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                        >
                            Contact Me
                        </a>
                    </div>

                    <div className="flex gap-8 pt-4">
                        <div>
                            <p className="text-3xl font-bold text-slate-950 dark:text-white">10+</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Projects</p>
                        </div>

                        <div>
                            <p className="text-3xl font-bold text-slate-950 dark:text-white">React</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Main Stack</p>
                        </div>

                        <div>
                            <p className="text-3xl font-bold text-slate-950 dark:text-white">Fullstack</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Development</p>
                        </div>
                    </div>
                </div>

                <div className="relative mx-auto w-fit max-w-md">
                    <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-tr from-slate-200 to-slate-100 blur-3xl dark:from-slate-800 dark:to-slate-900" />

                    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                        <img
                            src="/profile-image.png"
                            alt="Phillip portrait placeholder"
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
                                About Me
                            </p>

                            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                                Building modern digital products with clean structure and refined user experience.
                            </h2>

                            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
                                My focus is on developing applications that are visually polished, technically scalable,
                                and intuitive to use. I enjoy transforming ideas into performant products with
                                thoughtful design and maintainable code.
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
                            key={item.title}
                            className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                        >
                            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{item.title}</h3>

                            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
                                {item.description}
                            </p>
                        </article>
                    ))}
                </div>
            </section>

            <section id="contact" className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-12 text-center dark:border-slate-800">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Contact</p>

                    <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                        Let's create something exceptional.
                    </h2>

                    <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">
                        Open for freelance projects, collaborations, and modern web development opportunities.
                    </p>

                    <a
                        href="mailto:koflerphillip@outlook.com"
                        className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                    >
                        koflerphillip@outlook.com
                    </a>
                </div>
            </section>
        </div>
    );
}
