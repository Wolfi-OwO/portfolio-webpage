import { Link } from 'react-router-dom';

const emailAddress = 'koflerphillip@outlook.com';

export default function ContactPage() {
    return (
        <div className="py-16 lg:py-24">
            <div className="mx-auto max-w-6xl px-6 lg:px-8 space-y-20">

                <section className="grid gap-10 lg:grid-cols-2 lg:items-end">
                    <div className="space-y-5">
                        <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                            Contact
                        </p>

                        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-950 dark:text-white">
                            Let's build something exceptional.
                        </h1>

                        <p className="text-base leading-8 text-slate-600 dark:text-slate-300 max-w-xl">
                            Freelance work, collaborations, and modern web engineering projects are welcome.
                            I typically respond within 24-48 hours.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 lg:justify-end align-cen">
                        <Link
                            to="/projects"
                            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950"
                        >
                            View Projects
                        </Link>

                        <Link
                            to="/"
                            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        >
                            Back Home
                        </Link>
                    </div>
                </section>

                <section className="relative">
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 to-slate-900 rounded-[2rem]" />

                    <div className="rounded-[2rem] border border-white/10 p-10 sm:p-14 text-center backdrop-blur">
                        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                            Direct Contact
                        </p>

                        <h2 className="mt-4 text-2xl sm:text-3xl font-semibold text-white">
                            Email is the fastest way to reach me
                        </h2>

                        <p className="mt-4 text-slate-300 max-w-2xl mx-auto leading-7">
                            If you have a project, idea, or collaboration request, send a message and I'll get back shortly.
                        </p>

                        <a
                            href={`mailto:${emailAddress}`}
                            className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                        >
                            {emailAddress}
                        </a>
                    </div>
                </section>

            </div>
        </div>
    );
}