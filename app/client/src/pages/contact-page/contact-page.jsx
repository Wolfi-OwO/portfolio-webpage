import { Link } from 'react-router-dom';

const emailAddress = 'koflerphillip@outlook.com';
const githubUrl = 'https://github.com/Wolfi-OwO';
const linkedInUrl = 'https://www.linkedin.com/in/kofler-phillip-8666ab338/';

const contactMethods = [
    {
        label: 'Email',
        value: emailAddress,
        description: 'Best for project inquiries and freelance work.',
        href: `mailto:${emailAddress}`,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
            </svg>
        ),
    },
    {
        label: 'GitHub',
        value: 'koflerphillip',
        description: 'Open-source work and personal projects.',
        href: githubUrl,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.97 3.22 9.18 7.69 10.67.56.1.77-.24.77-.54v-1.9c-3.13.68-3.79-1.34-3.79-1.34-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.73 1.16 1.73 1.16 1 .73 2.04 1.27 3.18 1.27 1.16 0 1.92-.44 2.66-1.27 1-1.7 2.59-2.94 4.46-3.61-.16-.4-.7-2 .15-4.16 0 0 1.27-.4 4.18 1.55 1.21-.34 2.5-.51 3.78-.52 1.28.01 2.57.18 3.78.52 2.9-1.95 4.17-1.55 4.17-1.55.86 2.16.32 3.76.16 4.16.97.67 1.56 1.78 1.56 3.06 0 4.39-2.67 5.35-5.21 5.64.41.35.78 1.04.78 2.1v3.11c0 .31.21.66.79.55 4.46-1.49 7.68-5.7 7.68-10.66C23.25 5.48 18.27.5 12 .5Z" />
            </svg>
        ),
    },
    {
        label: 'LinkedIn',
        value: 'phillip-kofler',
        description: 'Professional network and career updates.',
        href: linkedInUrl,
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0Z" />
            </svg>
        ),
    },
];

const services = [
    {
        title: 'Web Applications',
        description: 'Full-stack React applications with polished UI and reliable backends.',
    },
    {
        title: 'Frontend Engineering',
        description: 'Scalable component systems, design tokens, and refined interaction details.',
    },
    {
        title: 'API & Integrations',
        description: 'REST APIs, authentication, and third-party service integrations.',
    },
    {
        title: 'Consulting',
        description: 'Technical reviews, architecture feedback, and stack recommendations.',
    },
];

const responseInfo = [
    { label: 'Response Time', value: '24–48h' },
    { label: 'Based In', value: 'Austria' },
    { label: 'Availability', value: 'Open' },
];

export default function ContactPage() {
    return (
        <div className="space-y-20 py-10 lg:py-14">
            <section className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-14">
                    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 blur-3xl dark:from-slate-800 dark:to-slate-900" />
                    <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-gradient-to-tr from-slate-100 to-slate-50 blur-3xl dark:from-slate-900 dark:to-slate-950" />

                    <div className="relative grid gap-10 lg:grid-cols-2 lg:items-end">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                </span>
                                Available for new projects
                            </div>

                            <h1 className="text-5xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-6xl">
                                Let's build something exceptional.
                            </h1>

                            <p className="max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                                Freelance work, collaborations, and modern web engineering projects are welcome.
                                I typically respond within 24–48 hours.
                            </p>

                            <div className="flex flex-wrap gap-3">
                                <a
                                    href={`mailto:${emailAddress}`}
                                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                                >
                                    Send an Email
                                </a>

                                <Link
                                    to="/projects"
                                    className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                                >
                                    View Projects
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {responseInfo.map(info => (
                                <div
                                    key={info.label}
                                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <p className="text-2xl font-bold text-slate-950 dark:text-white">{info.value}</p>
                                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                        {info.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="mb-8 flex items-end justify-between gap-6">
                    <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                            Get in Touch
                        </p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                            Pick the channel that suits you best.
                        </h2>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    {contactMethods.map(method => (
                        <a
                            key={method.label}
                            href={method.href}
                            target={method.href.startsWith('mailto:') ? undefined : '_blank'}
                            rel={method.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                            className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
                        >
                            <div className="flex items-center justify-between">
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 transition group-hover:bg-slate-950 group-hover:text-white dark:bg-slate-900 dark:text-slate-200 dark:group-hover:bg-white dark:group-hover:text-slate-950">
                                    {method.icon}
                                </div>

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-950 dark:text-slate-500 dark:group-hover:text-white"
                                >
                                    <path d="M7 17 17 7" />
                                    <path d="M8 7h9v9" />
                                </svg>
                            </div>

                            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                {method.label}
                            </p>

                            <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                                {method.value}
                            </p>

                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                {method.description}
                            </p>
                        </a>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
                        <div>
                            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                                How I Can Help
                            </p>

                            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                                Projects I enjoy working on.
                            </h2>

                            <p className="mt-6 max-w-md text-base leading-8 text-slate-600 dark:text-slate-300">
                                Whether you're shipping a new product, refining an existing interface, or exploring
                                an idea — I'm happy to talk through scope, timeline, and the best way forward.
                            </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {services.map(service => (
                                <div
                                    key={service.title}
                                    className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <p className="text-base font-semibold text-slate-950 dark:text-white">
                                        {service.title}
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                        {service.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-10 text-center sm:p-16">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />

                    <div className="relative mx-auto max-w-2xl">
                        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                            Direct Contact
                        </p>

                        <h2 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                            Email is the fastest way to reach me.
                        </h2>

                        <p className="mt-5 leading-8 text-slate-300">
                            Have a project, idea, or collaboration request? Drop a message and I'll get back shortly.
                        </p>

                        <a
                            href={`mailto:${emailAddress}`}
                            className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                        >
                            {emailAddress}

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4 transition group-hover:translate-x-0.5"
                            >
                                <path d="M5 12h14" />
                                <path d="m13 5 7 7-7 7" />
                            </svg>
                        </a>

                        <p className="mt-6 text-xs uppercase tracking-[0.2em] text-slate-500">
                            Or stop by{' '}
                            <Link to="/" className="text-slate-300 underline-offset-4 hover:underline">
                                the homepage
                            </Link>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
