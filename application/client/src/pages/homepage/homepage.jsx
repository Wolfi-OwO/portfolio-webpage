import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import LoadingScreen from '../../components/loading-screen.jsx';
import { useApiList } from '../../hooks/useApiList.js';
import { Link } from 'react-router-dom';
import { Lines, ProjectCard } from '../../components/design-bits.jsx';
import { fmtYear } from '../../utils/format-year.js';
import '../../proto.css';
import AvailabilityBadge from '../../components/availability-badge.jsx';
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

import { FaDatabase } from 'react-icons/fa';

// react-icons ships no Azure mark (the brand set dropped it), so the logo is drawn here.
const SiAzure = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
        <path d="M13.05 2 6.6 7.9 1 21.7h5.1zm.9 1.6L11 11.3l5.7 7.1-10.6 1.6H23z" />
    </svg>
);

const technologies_list = [
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
        icon: SiAzure,
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
        'Fullstack Web Development',
        'Woofi Developments builds modern web applications with React, Node.js, and cloud technologies - fullstack software development based in Carinthia, Austria.',
    );

    const [booting, setBooting] = useState(shouldBoot);
    // Availability is fetched once and shared: the hero badge and the career preview are two views of the same list.
    const [availability] = useApiList('/api/availability');
    const [projects] = useApiList('/api/projects');
    const [technologies] = useApiList('/api/technologies');
    const tech = Object.fromEntries(technologies.map((t) => [t._id, t.tech]));
    const badge = badgeState(availability.filter((entry) => entry.published));
    const career = availability
        .filter((e) => e.track === 'career' && e.published)
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    const featured = [2, 0, 3].map((i) => projects[i]).filter(Boolean);

    return (
        <>
            {booting && <LoadingScreen onDone={() => setBooting(false)} />}
            <div className="pw">
                <div className="page" style={{ padding: 0, maxWidth: 1040 }}>
                    <section className="hero">
                        <div className="hero-top mono muted">
                            <span>Portfolio · Carinthia, AT</span>
                            <span className="hb">
                                <AvailabilityBadge badge={badge} />
                            </span>
                        </div>
                        <Lines
                            lines={[
                                <>
                                    Hi, I'm <em>{IDENTITY.name}</em>.
                                </>,
                                'I make software that',
                                'does what it says.',
                            ]}
                        />
                        <div className="hero-row">
                            <img
                                className="portrait"
                                src="/profile-image.jpg"
                                alt={`${IDENTITY.name}, portrait`}
                                fetchPriority="high"
                            />
                            <div>
                                <p className="lead big">
                                    <FormattedMessage
                                        id="homepage.role"
                                        defaultMessage="Fullstack developer / Carinthia, Austria"
                                    />
                                    .
                                </p>
                                <p className="lead">
                                    <FormattedMessage
                                        id="homepage.bio"
                                        defaultMessage="I'm a software developer from Carinthia. I graduated from HTL Villach in 2026 with a Reife- und Diplomprüfung in computer science, and I've done software engineering internships at Infineon Technologies. I work on web applications, on apps in general — Android and desktop among them — and on projects in data science and AI. More about my background on <link>LinkedIn</link>."
                                        values={{
                                            link: (chunks) => (
                                                <a
                                                    href={IDENTITY.linkedInUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="acc"
                                                >
                                                    {chunks}
                                                </a>
                                            ),
                                        }}
                                    />
                                </p>
                                <div className="btns">
                                    <Link className="btn" to="/contact">
                                        Start a conversation
                                    </Link>
                                    <Link className="btn ghost" to="/projects">
                                        Read the work →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="sec-label">
                            <span className="sec-n">01</span>Selected work
                        </h2>
                        <div className="grid3">
                            {featured.map((p) => (
                                <ProjectCard key={p._id} p={p} tech={tech} />
                            ))}
                        </div>
                        <Link className="btn ghost more" to="/projects">
                            All {projects.length} projects →
                        </Link>
                    </section>

                    <section>
                        <h2 className="sec-label">
                            <span className="sec-n">02</span>Where I've been
                        </h2>
                        <div className="mini-career">
                            {career.slice(0, 3).map((e) => (
                                <div
                                    className={`crow k-${e.kind === 'education' ? 'education' : 'work'}`}
                                    key={e._id}
                                >
                                    <span className="mono muted when">
                                        {fmtYear(e.startDate)} — {fmtYear(e.endDate)}
                                    </span>
                                    <div>
                                        <b>{e.title}</b>
                                        <span className="org">
                                            {e.organisation}
                                            {e.location ? ` · ${e.location.split(',')[0]}` : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link className="btn ghost more" to="/career">
                            Full career & education →
                        </Link>
                    </section>

                    <section>
                        <h2 className="sec-label">
                            <span className="sec-n">03</span>Activity
                        </h2>
                        <ActivityHeatmap />
                    </section>

                    <section>
                        <h2 className="sec-label">
                            <span className="sec-n">04</span>Technologies I use
                        </h2>
                        <div className="marquee" aria-label="Technologies I use">
                            <div className="marquee-track">
                                {[0, 1].map((copy) => (
                                    <ul key={copy} className="marquee-set" aria-hidden={copy === 1}>
                                        {technologies_list.map(({ name, icon: Icon, color }) => (
                                            <li className="tech" key={name}>
                                                <Icon className="tico" style={{ color }} />
                                                {name}
                                            </li>
                                        ))}
                                    </ul>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="cta-band">
                        <h2>Not sure what you need?</h2>
                        <p>
                            Describe what should happen and I'll tell you what it takes to build it,
                            even if it isn't worth it.
                        </p>
                        <Link className="btn" to="/contact">
                            Start a conversation
                        </Link>
                    </section>
                </div>
            </div>
        </>
    );
}
