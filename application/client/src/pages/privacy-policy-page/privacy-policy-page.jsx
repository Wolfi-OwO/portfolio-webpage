import { FormattedDate, FormattedMessage } from 'react-intl';
import { usePageMeta } from '../../hooks/usePageMeta.js';

const LAST_UPDATED = new Date('2026-07-11');

const EMAIL = 'KoflerPhillip@outlook.com';
const LINKEDIN = 'https://www.linkedin.com/in/kofler-phillip-8666ab338/';
const AUTHORITY = 'https://www.dsb.gv.at';

/**
 * Written in the first person on purpose: this is a one-person site, and a
 * privacy policy that says "the operator" about a single developer reads like
 * boilerplate someone bought. Every claim below describes what this app
 * actually does — no analytics, no cookies, localStorage for theme and locale,
 * server logs, and the third parties that hosting genuinely involves.
 */
export default function PrivacyPolicyPage() {
    usePageMeta(
        'Privacy Policy',
        'How this site handles data: no tracking, no analytics, no cookies — and exactly what does get processed.',
    );

    return (
        <div className="animate-fade-up mx-auto max-w-5xl">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                <FormattedMessage id="privacy.label" defaultMessage="Legal" />
            </p>

            <h1 className="mt-4 text-4xl font-extrabold text-[var(--text)]">
                <FormattedMessage id="privacy.title" defaultMessage="Privacy policy" />
            </h1>

            <p className="mt-4 leading-7 text-[var(--muted)]">
                <FormattedMessage
                    id="privacy.intro"
                    defaultMessage="I built this site myself and I run it myself, so I can tell you exactly what happens to your data here: as little as possible. There is no analytics, no tracking, no advertising and no consent banner — because there is nothing to consent to. Below I explain, section by section, what is processed anyway, why, and on what legal basis."
                />
            </p>

            <p className="mt-3 text-sm text-[var(--muted)]">
                <FormattedMessage
                    id="privacy.updated"
                    defaultMessage="Last updated: {date}"
                    values={{
                        date: (
                            <FormattedDate
                                value={LAST_UPDATED}
                                day="numeric"
                                month="long"
                                year="numeric"
                            />
                        ),
                    }}
                />
            </p>

            <div className="mt-10 space-y-px overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--line)]">
                <Section id="privacy.controller" defaultTitle="Who is responsible">
                    <FormattedMessage
                        id="privacy.controller.text"
                        defaultMessage={
                            'I am the controller for the data processed on this website:\n\nPhillip Kofler\nSoftware Engineer | Fullstack Developer\nVillach, Carinthia, Austria'
                        }
                    />
                    <br />
                    <br />
                    <FormattedMessage
                        id="privacy.controller.contact"
                        defaultMessage="You can reach me at "
                    />
                    <Mail />
                    <FormattedMessage
                        id="privacy.controller.contactEnd"
                        defaultMessage=" for anything in this document, including requests about your rights."
                    />
                </Section>

                <Section id="privacy.principle" defaultTitle="The short version">
                    <FormattedMessage
                        id="privacy.principle.text"
                        defaultMessage="I collect no personal data about you beyond what a web server unavoidably sees when it answers your request. I set no cookies. I use no analytics, no tag manager, no advertising network, no social plugins that phone home. I do not build profiles, I do not sell anything to anyone, and I have no interest in who you are — I would rather you just looked at the projects."
                    />
                </Section>

                <Section id="privacy.logs" defaultTitle="Server log files">
                    <FormattedMessage
                        id="privacy.logs.text"
                        defaultMessage={
                            'When you open a page, your browser sends a request to my server, and that request is logged. A log entry can contain your IP address, the date and time, the requested URL, the HTTP status code, the referring page and your browser and operating system identification (user agent).\n\nI need this to run the site at all: to deliver the page, to find errors, and to notice abuse such as brute-force attempts against the admin login. The legal basis is my legitimate interest in operating a secure, functioning website (Art. 6(1)(f) GDPR). Log data is not merged with anything else, is never used to identify you, and is kept only as long as it is useful for those purposes — a short period, after which it is deleted or overwritten.'
                        }
                    />
                </Section>

                <Section id="privacy.hosting" defaultTitle="Hosting and infrastructure">
                    <FormattedMessage
                        id="privacy.hosting.text"
                        defaultMessage={
                            'The site runs as a container on Microsoft Azure, and its content (projects, technologies, status samples) lives in a MongoDB Atlas database. Both providers process data strictly on my instructions as processors under Art. 28 GDPR, and both necessarily handle the technical connection data described above.\n\nI chose them for reliability, not for data collection, and I store no visitor records in the database — the only rows in it are the ones I put there about my own work.'
                        }
                    />
                </Section>

                <Section id="privacy.fonts" defaultTitle="Fonts">
                    <FormattedMessage
                        id="privacy.fonts.text"
                        defaultMessage="The typefaces used here (Manrope and JetBrains Mono) are loaded from Google Fonts. That means your browser requests the font files from a Google server, and Google therefore receives your IP address for the duration of that request. The legal basis is again my legitimate interest in a consistent presentation (Art. 6(1)(f) GDPR). No cookie is set by that request."
                    />
                </Section>

                <Section id="privacy.storage" defaultTitle="What is stored in your browser">
                    <FormattedMessage
                        id="privacy.storage.text"
                        defaultMessage={
                            "This site sets no cookies. It does use your browser's local storage for two small settings, so the site behaves the way you left it:\n\n• theme — whether you prefer the light or the dark appearance\n• locale — the language you picked\n\nSession storage additionally remembers that you have already seen the boot animation, so it does not replay on every visit within a tab. All three values stay on your device, are never sent to my server, and you can clear them at any time in your browser settings. Nothing here identifies you."
                        }
                    />
                </Section>

                <Section id="privacy.contact" defaultTitle="Contacting me">
                    <FormattedMessage
                        id="privacy.contact.text"
                        defaultMessage="There is no contact form on this site — deliberately, because a form would mean collecting your data through my server. Instead I link my email address and my LinkedIn profile. If you write to me, I process what you send (your address, your name if you give it, and the content of your message) for the sole purpose of answering you, on the basis of Art. 6(1)(b) or (f) GDPR. I keep such correspondence only as long as the matter needs it, and I delete it once it is settled."
                    />
                    <br />
                    <br />
                    <Mail />
                    <br />
                    <a
                        href={LINKEDIN}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] underline underline-offset-4"
                    >
                        linkedin.com/in/kofler-phillip-8666ab338
                    </a>
                </Section>

                <Section id="privacy.status" defaultTitle="The status page">
                    <FormattedMessage
                        id="privacy.status.text"
                        defaultMessage="The status page shows whether my own services are reachable. The checks behind it ping my own deployments on a schedule and store the result — response time and up/down — in my database. They measure my infrastructure, not you: no visitor data of any kind is recorded there."
                    />
                </Section>

                <Section id="privacy.admin" defaultTitle="The admin area">
                    <FormattedMessage
                        id="privacy.admin.text"
                        defaultMessage="There is a login route that only I use, to maintain the content of the site. It issues a signed token to my own browser and stores no data about visitors. Passwords are never stored in plain text, only as a hash."
                    />
                </Section>

                <Section id="privacy.sharing" defaultTitle="Sharing with third parties">
                    <FormattedMessage
                        id="privacy.sharing.text"
                        defaultMessage="I pass your data to no one. The only parties that touch it are the processors named above, who need it to keep the site online, and any authority I am legally obliged to answer. There is no sale, no exchange and no transfer for advertising purposes — none of that would even be possible with the data I hold."
                    />
                </Section>

                <Section id="privacy.security" defaultTitle="Security">
                    <FormattedMessage
                        id="privacy.security.text"
                        defaultMessage="Traffic to this site is encrypted in transit with TLS (HTTPS). The application runs as an unprivileged user in a container, secrets are held outside the source code, and I keep dependencies patched. No transmission over the internet can be guaranteed absolutely secure, but the less data a site holds, the less there is to lose — which is the main reason it holds so little."
                    />
                </Section>

                <Section id="privacy.rights" defaultTitle="Your rights">
                    <FormattedMessage
                        id="privacy.rights.text"
                        defaultMessage={
                            'Under the GDPR you have the right to request access to the data I hold about you, to have it corrected or erased, to have its processing restricted, to receive it in a portable format, and to object to processing based on legitimate interest.\n\nWrite to me and I will answer within a month. In practice the honest answer will usually be that I hold nothing about you at all beyond a short-lived log line.\n\nYou also have the right to complain to a supervisory authority. For Austria that is the Datenschutzbehörde in Vienna.'
                        }
                    />
                    <br />
                    <br />
                    <a
                        href={AUTHORITY}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] underline underline-offset-4"
                    >
                        dsb.gv.at
                    </a>
                </Section>

                <Section id="privacy.changes" defaultTitle="Changes to this policy">
                    <FormattedMessage
                        id="privacy.changes.text"
                        defaultMessage="If I change what this site does, I change this page with it. The date above tells you which version you are reading."
                    />
                </Section>

                <Section id="privacy.imprint" defaultTitle="Imprint">
                    <FormattedMessage
                        id="privacy.imprint.text"
                        defaultMessage={
                            'Information pursuant to §5 ECG and §25 MedienG:\n\nPhillip Kofler\nSoftware Engineer | Fullstack Developer\nVillach, Carinthia, Austria\n\nBusiness activity: software development, web development and digital solutions — modern web applications, REST APIs, dashboards and cloud-based systems.\n\nResponsible for the content of this site: Phillip Kofler. The contents are written with care, but I give no guarantee of accuracy, completeness or currentness. Where this site links to external pages, I have no influence over their content and take no responsibility for it. All content here is protected by copyright; use beyond the statutory limits needs my permission first.'
                        }
                    />
                </Section>
            </div>
        </div>
    );
}

function Mail() {
    return (
        <a href={`mailto:${EMAIL}`} className="text-[var(--accent)] underline underline-offset-4">
            {EMAIL}
        </a>
    );
}

function Section({ id, defaultTitle, children }) {
    return (
        <section className="bg-[var(--surface)] p-6 sm:p-8">
            <h2 className="text-lg font-bold text-[var(--accent)]">
                <FormattedMessage id={`${id}.title`} defaultMessage={defaultTitle} />
            </h2>

            <div className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--text)]">
                {children}
            </div>
        </section>
    );
}
