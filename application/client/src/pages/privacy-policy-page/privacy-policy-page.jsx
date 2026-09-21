import { FormattedDate, FormattedMessage } from 'react-intl';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import ImprintText from '../../components/imprint-text.jsx';

const LAST_UPDATED = new Date('2026-09-21');

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
                            'When you open a page, your request reaches my web server (Caddy). It writes one log line per request containing the time, the requested host name, the HTTP method and protocol, the response status, the size and duration of the response, and technical TLS connection details. Before a line is written, your IP address, the requested path and query string, and all request and response headers (including referrer and user agent) are removed. I therefore do not store your IP address in the server log.\n\nI need this log to run the site: to deliver pages and to find errors. The legal basis is my legitimate interest in operating a secure, functioning website (Art. 6(1)(f) GDPR). Log lines are not merged with anything else, are never used to identify you, and are kept in a size-limited rotating log for a short time before being overwritten.\n\nTo slow down abuse such as brute-force attempts against the admin login, the application counts requests per connection address in working memory only. These counters are not written to disk or to the database and disappear when the application restarts.'
                        }
                    />
                </Section>

                <Section id="privacy.hosting" defaultTitle="Hosting and infrastructure">
                    <FormattedMessage
                        id="privacy.hosting.text"
                        defaultMessage={
                            "The site runs as a container on a virtual server (VPS) from Contabo, where the Caddy web server terminates the encrypted connection. This is the only host that sees your connection when you visit. The site content (projects, technologies, status samples) lives in a MongoDB Atlas database, and my scheduled status checks run as a Microsoft Azure Function. Atlas and Azure only exchange data with my own server and checker, not with your browser. Contabo, MongoDB and Microsoft process data strictly on my instructions as processors under Art. 28 GDPR.\n\nI chose them for reliability, not for data collection, and I store no visitor records in the database — the only rows in it are the ones I put there about my own work, plus the results of my own status checks.\n\nThe status page also draws on Metrion, a second application of mine. The figures come from Metrion's ingest service and its self-hosted PostgreSQL/TimescaleDB database, both on the same Contabo VPS, which keeps uptime measurements (monitor name, up/down, response time) with no fixed deletion date; Metrion's dashboard runs on Microsoft Azure Container Apps but takes no part in the status request. Metrion is my own service rather than a third party, and the only traffic it receives from this site is the server-to-server status request described below, so it processes no visitor data either."
                        }
                    />
                </Section>

                <Section id="privacy.fonts" defaultTitle="Fonts">
                    <FormattedMessage
                        id="privacy.fonts.text"
                        defaultMessage="The typefaces used here (Manrope and JetBrains Mono) are served from my own server. Your browser makes no request to Google Fonts or any other outside host for them, so no IP address is passed to a third party in order to render this page."
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
                        defaultMessage={
                            "The status page shows whether my own services are reachable. It draws on two systems I run myself. The first is my own scheduled checks, which call my deployments once a minute (and once more straight away if a check fails) and store the result in my MongoDB database — response time, up/down, the HTTP status code and, for a failed check, a short technical error message that may end in a network error code such as (ECONNRESET). These results in MongoDB are deleted after 90 days. On 21 September 2026 I additionally copied the up/down and response-time results of all checks collected until then (not the status code or error message) into Metrion, where they are kept with no fixed deletion date so that my services' availability history stays available beyond 90 days. The second system is Metrion, a separate monitoring application of mine whose ingest service and self-hosted PostgreSQL/TimescaleDB database run on my Contabo VPS; it keeps the monitor name, up/down and response time of its own checks in the same way, with no fixed deletion date. The page also shows the median and 95th-percentile response time over the last 24 hours, calculated from stored response times.\n\nMy server fetches the figures from Metrion server-to-server through its public API, so your browser never makes a request to Metrion and no visitor IP reaches it that way. Both systems measure my infrastructure, not you: these check results describe my own services and contain no visitor data. My legal basis for keeping this history is my legitimate interest in documenting the availability of my own services (Art. 6(1)(f) GDPR)."
                        }
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

                {/* Also reachable on its own at /impressum — same message ids,
                    rendered through the same component, so they cannot drift. */}
                <Section id="privacy.imprint" defaultTitle="Imprint">
                    <ImprintText />
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
