import { Link } from 'react-router-dom';

const lastUpdated = 'May 18, 2026';

export default function PrivacyPolicyPage() {
    return (
        <div className="space-y-14 py-10 lg:py-14">
            <section className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="max-w-2xl space-y-4">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Legal</p>

                    <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                        Privacy Policy
                    </h1>

                    <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                        Last updated: {lastUpdated}
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-6 lg:px-8">
                <div className="space-y-10 rounded-[2rem] border border-slate-200 bg-white p-10 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Data collection</h2>

                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            This website is a personal portfolio and does not include user accounts or a contact form.
                            I do not intentionally collect personal data through this site.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Local storage</h2>

                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            To remember your preferred theme (light, dark, or system), the site stores a single value
                            in your browser&apos;s local storage under the key <span className="font-semibold">theme</span>
                            . You can remove it any time by clearing site data in your browser.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">External links</h2>

                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            This website may link to third-party sites (for example, project demos). Those sites have
                            their own privacy policies and practices.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Contact</h2>

                        <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                            Questions about this policy? Reach out via the{' '}
                            <Link
                                to="/contact"
                                className="font-semibold text-slate-900 underline underline-offset-4 transition hover:text-slate-700 dark:text-white dark:hover:text-slate-200"
                            >
                                contact page
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

