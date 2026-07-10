import { FormattedMessage } from 'react-intl';
import { usePageMeta } from '../../hooks/usePageMeta.js';

const lastUpdated = '10 July 2026';

export default function ImprintPage() {
    usePageMeta(
        'Imprint',
        'Legal information and imprint of Woofi Developments.',
    );

    return (
        <div className="space-y-14 py-10 lg:py-14">
            <section className="mx-auto max-w-4xl px-6 lg:px-8">
                <div className="max-w-2xl space-y-4">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                        <FormattedMessage
                            id="imprint.label"
                            defaultMessage="Legal"
                        />
                    </p>

                    <h1 className="text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                        <FormattedMessage
                            id="imprint.title"
                            defaultMessage="Imprint"
                        />
                    </h1>

                    <p className="text-sm text-slate-600 dark:text-slate-300">
                        <FormattedMessage
                            id="imprint.updated"
                            defaultMessage="Last updated: {date}"
                            values={{ date: lastUpdated }}
                        />
                    </p>
                </div>
            </section>


            <section className="mx-auto max-w-4xl px-6 lg:px-8">
                <div className="space-y-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">

                    <Section
                        title="imprint.operator.title"
                        defaultTitle="Website operator"
                    >
                        <FormattedMessage
                            id="imprint.operator.text"
                            defaultMessage={
                                'Phillip Kofler\nSoftware Engineer | Fullstack Developer\nVillach, Carinthia\nAustria'
                            }
                        />
                    </Section>


                    <Section
                        title="imprint.contact.title"
                        defaultTitle="Contact"
                    >
                        <FormattedMessage
                            id="imprint.contact.text"
                            defaultMessage="Email: KoflerPhillip@outlook.com"
                        />

                        <br />

                        <FormattedMessage
                            id="imprint.linkedin"
                            defaultMessage="LinkedIn profile"
                        />
                        :
                        <br />

                        <a
                            href="https://www.linkedin.com/in/kofler-phillip-8666ab338/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline underline-offset-4"
                        >
                            linkedin.com/in/kofler-phillip-8666ab338
                        </a>
                    </Section>


                    <Section
                        title="imprint.activity.title"
                        defaultTitle="Business activity"
                    >
                        <FormattedMessage
                            id="imprint.activity.text"
                            defaultMessage="Software development, web development and digital solutions."
                        />
                    </Section>


                    <Section
                        title="imprint.services.title"
                        defaultTitle="Services"
                    >
                        <FormattedMessage
                            id="imprint.services.text"
                            defaultMessage="Development of modern web applications, REST APIs, dashboards, cloud-based applications and customized software solutions."
                        />
                    </Section>


                    <Section
                        title="imprint.background.title"
                        defaultTitle="Professional background"
                    >
                        <FormattedMessage
                            id="imprint.background.text"
                            defaultMessage="Phillip Kofler is a Software Engineer with experience in REST APIs, dashboard development and modern software engineering practices. Previous experience includes software development and technical IT support at Infineon Technologies."
                        />
                    </Section>


                    <Section
                        title="imprint.education.title"
                        defaultTitle="Education"
                    >
                        <FormattedMessage
                            id="imprint.education.text"
                            defaultMessage="Completed Reife- und Diplomprüfung at HTL Villach in Computer and Information Technology Administration and Management."
                        />
                    </Section>


                    <Section
                        title="imprint.content.title"
                        defaultTitle="Responsible for content"
                    >
                        <FormattedMessage
                            id="imprint.content.text"
                            defaultMessage="Phillip Kofler"
                        />
                    </Section>


                    <Section
                        title="imprint.liability.title"
                        defaultTitle="Liability for content"
                    >
                        <FormattedMessage
                            id="imprint.liability.text"
                            defaultMessage="The contents of this website are created with care. However, no guarantee can be given regarding accuracy, completeness or currentness."
                        />
                    </Section>


                    <Section
                        title="imprint.external.title"
                        defaultTitle="External links"
                    >
                        <FormattedMessage
                            id="imprint.external.text"
                            defaultMessage="This website may contain links to external websites. No responsibility is assumed for their content."
                        />
                    </Section>


                    <Section
                        title="imprint.copyright.title"
                        defaultTitle="Copyright"
                    >
                        <FormattedMessage
                            id="imprint.copyright.text"
                            defaultMessage="All content on this website is protected by copyright. Any use outside legal limits requires prior permission."
                        />
                    </Section>


                    <Section
                        title="imprint.privacy.title"
                        defaultTitle="Privacy"
                    >
                        <FormattedMessage
                            id="imprint.privacy.text"
                            defaultMessage="Information about the processing of personal data can be found in the privacy policy of this website."
                        />
                    </Section>

                </div>
            </section>
        </div>
    );
}


function Section({ title, defaultTitle, children }) {
    return (
        <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
                <FormattedMessage
                    id={title}
                    defaultMessage={defaultTitle}
                />
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600 dark:text-slate-300">
                {children}
            </p>
        </div>
    );
}