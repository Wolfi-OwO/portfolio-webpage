import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { SocialRow } from '../../components/identity.jsx';
import LoadingScreen from '../../components/loading-screen.jsx';
import AvailabilityTimeline from '../../components/availability-timeline.jsx';
import ActivityHeatmap from '../../components/activity-heatmap.jsx';
import { shouldBoot } from '../../utils/boot.js';
import { badgeState } from '../../utils/availability.js';
import { IDENTITY } from '../../utils/identity.js';
import {
    SiJavascript,
    SiTypescript,
    SiReact,
    SiAngular,
    SiTailwindcss,
    SiNodedotjs,
    SiExpress,
    SiSpringboot,
    SiOpenjdk,
    SiKotlin,
    SiDotnet,
    SiDocker,
    SiGithubactions,
    SiMongodb,
    SiPostgresql,
    SiGit,
} from 'react-icons/si';

import { FaDatabase, FaMicrosoft } from 'react-icons/fa';

const technologies = [
    {
        name: 'JavaScript',
        icon: SiJavascript,
        color: '#F7DF1E',
    },
    {
        name: 'TypeScript',
        icon: SiTypescript,
        color: '#3178C6',
    },
    {
        name: 'React',
        icon: SiReact,
        color: '#61DAFB',
    },
    {
        name: 'Angular',
        icon: SiAngular,
        color: '#DD0031',
    },
    {
        name: 'Tailwind CSS',
        icon: SiTailwindcss,
        color: '#06B6D4',
    },

    {
        name: 'Node.js',
        icon: SiNodedotjs,
        color: '#339933',
    },
    {
        name: 'Express',
        icon: SiExpress,
        // Monochrome marks have no brand colour of their own — pinning them to white
        // makes them vanish on the light theme, so they ride the text token instead.
        color: 'var(--text)',
    },
    {
        name: 'Spring Boot',
        icon: SiSpringboot,
        color: '#6DB33F',
    },
    {
        name: 'Java',
        icon: SiOpenjdk,
        color: '#ED8B00',
    },
    {
        name: 'Kotlin',
        icon: SiKotlin,
        color: '#7F52FF',
    },
    {
        name: '.NET Core',
        icon: SiDotnet,
        color: '#512BD4',
    },

    {
        name: 'Docker',
        icon: SiDocker,
        color: '#2496ED',
    },
    {
        name: 'Azure',
        icon: FaMicrosoft,
        color: '#0078D4',
    },
    {
        name: 'GitHub Actions',
        icon: SiGithubactions,
        color: 'var(--text)',
    },
    {
        name: 'MongoDB',
        icon: SiMongodb,
        color: '#47A248',
    },
    {
        name: 'PostgreSQL',
        icon: SiPostgresql,
        color: '#4169E1',
    },
    {
        name: 'SQL',
        icon: FaDatabase,
        color: 'var(--text)',
    },
    {
        name: 'Git',
        icon: SiGit,
        color: '#F05032',
    },
];

export default function Homepage() {
    usePageMeta(
        'Fullstack & AI-Powered Web Development',
        'Woofi Developments builds modern, AI-powered web applications with React, Node.js, and cloud technologies - fullstack software development based in Carinthia, Austria.',
    );

    const [booting, setBooting] = useState(shouldBoot);

    // Availability is fetched once here and shared: the hero badge and the timeline
    // are two views of the same list, so they cannot contradict each other.
    const [availability, setAvailability] = useState([]);

    useEffect(() => {
        let active = true;

        fetch('/api/availability')
            .then((res) => (res.ok ? res.json() : []))
            .then((list) => {
                if (active) setAvailability(list);
            })
            .catch(() => {
                // The badge falls back to "open to work" on an empty list; a portfolio
                // that hides its own name because one endpoint is down is worse.
            });

        return () => {
            active = false;
        };
    }, []);

    const badge = badgeState(availability.filter((entry) => entry.published));

    return (
        <>
            {booting && <LoadingScreen onDone={() => setBooting(false)} />}

            <div className={`mx-auto max-w-5xl ${booting ? '' : 'animate-fade-up'}`}>
                {/* ── Hero: who I am, what I do, how to reach me ──────────────────── */}
                <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-9">
                    <div className="flex items-start gap-5 sm:gap-6">
                        <img
                            src="/profile-image.jpg"
                            alt={`${IDENTITY.name}, portrait`}
                            fetchPriority="high"
                            className="w-25 sm:h-30 sm:w-25 h-40 shrink-0 rounded-xl border border-[var(--line)] object-cover"
                        />

                        <div className="min-w-0 pt-0.5">
                            <AvailabilityBadge badge={badge} />

                            <h1 className="mt-2 text-5xl font-extrabold text-[var(--text)]">
                                {IDENTITY.name}
                            </h1>

                            <p className="mt-1 font-mono text-sm text-[var(--muted)]">
                                <span className="text-[var(--accent)]">~</span> {IDENTITY.handle}
                            </p>

                            <p className="mt-2 text-base font-medium text-[var(--accent)]">
                                <FormattedMessage
                                    id="homepage.role"
                                    defaultMessage="Fullstack developer / Carinthia, Austria"
                                />
                            </p>
                        </div>
                    </div>

                    <p className="mt-7 max-w-2xl leading-7 text-[var(--muted)]">
                        <FormattedMessage
                            id="homepage.bio"
                            defaultMessage="I'm a software developer from Carinthia. I graduated from HTL Villach in 2026 with a Reife- und Diplomprüfung in computer science, and I've done software engineering internships at Infineon Technologies. I work on web applications, on apps in general — Android and desktop among them — and on projects in data science and AI. More about my background on <link>LinkedIn</link>."
                            values={{
                                link: (chunks) => (
                                    <a
                                        href={IDENTITY.linkedInUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[var(--accent)] underline underline-offset-4"
                                    >
                                        {chunks}
                                    </a>
                                ),
                            }}
                        />
                    </p>

                    <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-[var(--line)] pt-4">
                        <SocialRow />
                    </div>
                </section>

                {/* ── When I am free ─────────────────────────────────────────────── */}
                <AvailabilityTimeline entries={availability} setEntries={setAvailability} />

                {/* ── What I have actually been doing (GitHub + GitLab) ───────────── */}
                <ActivityHeatmap />

                {/* ── What I work with ───────────────────────────────────────────── */}
                <section className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-9">
                    {/* The section label is set in mono, like a shell comment — the same
              structural voice the boot screen and the build chip already use. */}
                    <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                        <span className="text-[var(--accent)]">//</span>{' '}
                        <FormattedMessage
                            id="homepage.technologies"
                            defaultMessage="Technologies I use:"
                        />
                    </h2>

                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                        {technologies.map(({ name, icon: Icon, color }) => (
                            <div
                                key={name}
                                className="group flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]"
                            >
                                <Icon
                                    className="h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-110"
                                    style={{ color }}
                                />

                                <span className="truncate text-sm font-semibold text-[var(--text)]">
                                    {name}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

/** Reads whatever the availability calendar currently says — never a hard-coded claim. */
function AvailabilityBadge({ badge }) {
    const live = badge.tone === 'live';

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-2xs font-semibold uppercase tracking-[0.16em] ${
                live
                    ? 'border-[var(--live)] bg-[color-mix(in_srgb,var(--live)_10%,transparent)] text-[var(--live)]'
                    : 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]'
            }`}
        >
            <span
                className={`animate-live h-1.5 w-1.5 rounded-full ${
                    live ? 'bg-[var(--live)]' : 'bg-[var(--accent)]'
                }`}
            />
            <FormattedMessage id={badge.id} defaultMessage={badge.defaultMessage} />
        </span>
    );
}
