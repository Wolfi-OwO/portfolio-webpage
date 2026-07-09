import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { LiveStatusLine } from '../../components/identity.jsx';
import { IDENTITY, SOCIALS } from '../../utils/identity.js';

const channels = [
    { key: 'email', note: 'Best for project inquiries and freelance work.' },
    { key: 'github', note: 'Open-source work and personal projects.' },
    { key: 'linkedin', note: 'Professional network and career updates.' },
    { key: 'discord', note: 'Quickest for a casual question. Click to copy my handle.' },
];

const facts = [
    { label: 'Response time', value: '24–48h' },
    { label: 'Based in', value: 'Austria' },
    { label: 'Availability', value: 'Open' },
];

function ArrowIcon(props) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
            <path d="M7 17 17 7" />
            <path d="M8 7h9v9" />
        </svg>
    );
}

/** One reachable channel. Links navigate; Discord copies, because a username isn't a URL. */
function ChannelCard({ social, note }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return undefined;
        const id = setTimeout(() => setCopied(false), 1600);
        return () => clearTimeout(id);
    }, [copied]);

    const body = (
        <>
            <div className="flex items-center justify-between">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] text-[var(--muted)] transition group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
                    <social.Icon className="h-5 w-5" />
                </span>

                <span className="font-mono text-[11px] text-[var(--muted)] transition group-hover:text-[var(--accent)]">
                    {social.copy ? (copied ? 'copied' : 'copy') : <ArrowIcon className="h-4 w-4" />}
                </span>
            </div>

            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">{social.label}</p>
            {/* break-all, not truncate — a contact address you can't read in full is useless. */}
            <p className="mt-1.5 break-all font-display text-lg font-semibold text-[var(--text)]">{social.value}</p>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{note}</p>
        </>
    );

    const cls =
        'group flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-left transition hover:-translate-y-1 hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] motion-reduce:hover:translate-y-0';

    if (!social.href) {
        return (
            <button
                type="button"
                onClick={() => navigator.clipboard.writeText(social.copy).then(() => setCopied(true), () => setCopied(false))}
                aria-label={`Copy ${social.label} handle ${social.value}`}
                className={`${cls} cursor-pointer`}
            >
                {body}
            </button>
        );
    }

    return (
        <a
            href={social.href}
            target={social.href.startsWith('mailto:') ? undefined : '_blank'}
            rel={social.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
            className={cls}
        >
            {body}
        </a>
    );
}

export default function ContactPage() {
    usePageMeta(
        'Contact',
        'Get in touch about freelance projects, collaborations, and modern web engineering work. Usually responds within 24-48 hours.',
    );

    const bySocial = key => SOCIALS.find(s => s.key === key);

    return (
        <div className="relative">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--glow),transparent_70%)]"
            />

            <div className="relative mx-auto max-w-5xl space-y-16 px-6 py-12 lg:py-20">
                <section className="max-w-3xl">
                    <p className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--muted)]">get in touch</p>

                    <h1 className="mt-4 font-display text-5xl font-bold tracking-tight text-[var(--text)] sm:text-6xl">
                        Let&apos;s build something.
                    </h1>

                    <p className="mt-6 text-lg leading-8 text-[var(--muted)]">
                        Freelance work, collaborations, or just a question about something I&apos;ve built — pick
                        whichever channel suits you. I usually reply within a day or two.
                    </p>

                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <a
                            href={`mailto:${IDENTITY.email}`}
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
                        >
                            Send an email
                        </a>

                        <Link
                            to="/projects"
                            className="inline-flex items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        >
                            View projects
                        </Link>
                    </div>
                </section>

                <section>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {channels.map(channel => (
                            <ChannelCard key={channel.key} social={bySocial(channel.key)} note={channel.note} />
                        ))}
                    </div>
                </section>

                <section className="grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
                    {facts.map(fact => (
                        <div key={fact.label} className="bg-[var(--surface)] p-6">
                            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                                {fact.label}
                            </p>
                            <p className="mt-2 font-display text-2xl font-bold text-[var(--text)]">{fact.value}</p>
                        </div>
                    ))}
                </section>

                <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--muted)]">
                        while you&apos;re here
                    </p>
                    <div className="mt-3">
                        <LiveStatusLine />
                    </div>
                </section>
            </div>
        </div>
    );
}
