import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { IDENTITY, SOCIALS } from '../../utils/identity.js';

const notes = {
    email: 'Best for project work. I read it every day.',
    github: 'Everything I build in the open.',
    linkedin: 'Work history, if you need it.',
    discord: 'Fastest for a quick question. Click to copy.',
};

const facts = [
    ['Reply time', '1-2 days'],
    ['Based in', 'Carinthia, Austria'],
    ['Availability', 'Open to work'],
];

/** One channel per row. Links navigate; Discord copies, because it isn't a URL. */
function Channel({ social, note }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return undefined;
        const id = setTimeout(() => setCopied(false), 1600);
        return () => clearTimeout(id);
    }, [copied]);

    const inner = (
        <>
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--line)] text-[var(--muted)] transition group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
                <social.Icon className="h-4 w-4" />
            </span>

            <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-[var(--text)]">{social.label}</span>
                <span className="mt-0.5 block break-all font-mono text-sm text-[var(--accent)]">
                    {social.copy && copied ? 'Copied to clipboard' : social.value}
                </span>
                <span className="mt-1 block text-sm text-[var(--muted)]">{note}</span>
            </span>
        </>
    );

    const cls =
        'group flex w-full items-start gap-4 border-b border-[var(--line)] py-4 text-left first:pt-0 last:border-0 last:pb-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]';

    if (!social.href) {
        return (
            <button
                type="button"
                onClick={() =>
                    navigator.clipboard.writeText(social.copy).then(
                        () => setCopied(true),
                        () => setCopied(false),
                    )
                }
                aria-label={`Copy Discord handle ${social.value}`}
                className={`${cls} cursor-pointer`}
            >
                {inner}
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
            {inner}
        </a>
    );
}

export default function ContactPage() {
    usePageMeta(
        'Contact',
        'Get in touch about freelance projects, collaborations, and modern web engineering work. Usually responds within 24-48 hours.',
    );

    return (
        <div className="mx-auto max-w-2xl px-6 py-12 lg:py-16">
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">Get in touch</h1>

            <p className="mt-4 leading-7 text-[var(--muted)]">
                Freelance work, collaboration, or a question about something I built. Pick whichever channel suits
                you. I usually reply within a day or two.
            </p>

            <section className="mt-8 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6">
                {SOCIALS.map(social => (
                    <Channel key={social.key} social={social} note={notes[social.key]} />
                ))}
            </section>

            <dl className="mt-8 grid gap-px overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--line)] sm:grid-cols-3">
                {facts.map(([label, value]) => (
                    <div key={label} className="bg-[var(--surface)] p-5">
                        <dt className="text-xs uppercase tracking-wide text-[var(--muted)]">{label}</dt>
                        <dd className="mt-1.5 text-sm font-medium text-[var(--text)]">{value}</dd>
                    </div>
                ))}
            </dl>

            <div className="mt-10 flex flex-wrap gap-3">
                <a
                    href={`mailto:${IDENTITY.email}`}
                    className="rounded-md bg-[var(--text)] px-4 py-2 text-sm font-medium text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                    Send an email
                </a>
                <Link
                    to="/projects"
                    className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                    View projects
                </Link>
            </div>
        </div>
    );
}
