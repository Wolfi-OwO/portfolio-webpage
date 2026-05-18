import { Link } from 'react-router-dom';

const emailAddress = 'koflerphillip@outlook.com';

export default function ContactPage() {
    return (
        <div className="space-y-14 py-10 lg:py-14">
            <section className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl space-y-4">
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                            Contact
                        </p>

                        <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                            Let&apos;s create something exceptional.
                        </h1>

                        <p className="max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300">
                            Open for freelance projects, collaborations, and modern web development opportunities.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Link
                            to="/projects"
                            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                            View Projects
                        </Link>

                        <Link
                            to="/"
                            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                        >
                            Back Home
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-12 text-center dark:border-slate-800">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Email</p>

                    <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">
                        The quickest way to reach me is email.
                    </p>

                    <a
                        href={`mailto:${emailAddress}`}
                        className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                    >
                        {emailAddress}
                    </a>
                </div>
            </section>
        </div>
    );
}
