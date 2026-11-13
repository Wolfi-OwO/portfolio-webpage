import { FormattedMessage } from 'react-intl';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { useApiList } from '../../hooks/useApiList.js';
import { Link } from 'react-router-dom';
import { ProjectCard } from '../../components/design-bits.jsx';
import RunningNow from '../../components/running-now.jsx';
import '../../proto.css';
import ActivityHeatmap from '../../components/activity-heatmap.jsx';
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

    const [projects] = useApiList('/api/projects');
    const [technologies] = useApiList('/api/technologies');
    const tech = Object.fromEntries(technologies.map((t) => [t._id, t.tech]));
    const featured = ['Metrion', 'NetViz', 'Nutrilens']
        .map((t) => projects.find((p) => p.title === t))
        .filter(Boolean);

    return (
        <>
            <div className="pw">
                <div className="page" style={{ padding: 0 }}>
                    <section className="hero2">
                        <div className="hero2-main">
                            <div className="who">
                                <img
                                    src="/profile-image.webp"
                                    alt={`${IDENTITY.name}, portrait`}
                                    width="76"
                                    height="76"
                                    fetchPriority="high"
                                />
                                <span>
                                    Phillip
                                    <br />
                                    <FormattedMessage
                                        id="homepage.role"
                                        defaultMessage="Fullstack developer, Carinthia, Austria"
                                    />
                                </span>
                            </div>
                            <h1>
                                I make software that <em>does what it says.</em>
                            </h1>
                            <p className="lead">
                                <FormattedMessage
                                    id="homepage.bio"
                                    defaultMessage="I'm Phillip, a software developer from Carinthia. I build web applications, websites and apps, and I'm happiest where data and machine learning meet everyday software: tools that are fast and a pleasure to use. Alongside the code I climb, hike and keep tinkering with new ideas. More on <link>LinkedIn</link>."
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
                            <div className="hero2-links">
                                <Link to="/contact">Start a conversation</Link>
                                <Link to="/projects">Read the work</Link>
                                <Link to="/career">Career &amp; education</Link>
                            </div>
                        </div>
                        <RunningNow />
                    </section>

                    <section>
                        <h2 className="sec-label">Selected work</h2>
                        <div className="pgrid bento">
                            {featured.map((p, i) => (
                                <ProjectCard
                                    key={p._id}
                                    p={p}
                                    tech={tech}
                                    lead={i === 0}
                                    maxTags={3}
                                />
                            ))}
                        </div>
                        <Link className="btn ghost more" to="/projects">
                            All {projects.length} projects →
                        </Link>
                    </section>

                    <section>
                        <h2 className="sec-label">Activity</h2>
                        <ActivityHeatmap />
                    </section>

                    <section>
                        <h2 className="sec-label">Technologies I use</h2>
                        <div className="tech-row" aria-label="Technologies I use">
                            <div className="tech-track">
                                {[0, 1].map((copy) => (
                                    <ul className="tech-set" key={copy} aria-hidden={copy === 1}>
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

                    <section>
                        <h2 className="sec-label">About this site</h2>
                        <p className="colophon">
                            It runs on one VPS in the EU behind Caddy and is deployed from GitHub
                            Actions with a blue-green switch, so a release never takes the old
                            version down first. The fonts are served from here, nothing loads from a
                            third-party host, and the{' '}
                            <a href="https://status.woofi-developments.at">status page</a> shows
                            what is up right now.
                        </p>
                    </section>
                </div>
            </div>
        </>
    );
}
