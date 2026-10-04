import { useState } from 'react';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { useApiList } from '../../hooks/useApiList.js';
import { isAdmin } from '../../utils/auth.js';
import { ProjectCard } from '../../components/design-bits.jsx';
import ProjectsAdminPage from './projects-admin-page.jsx';

const FILTERS = ['All', 'React', 'TypeScript', 'Express', 'Python', 'Docker'];

// Visitors get the new design. Signed in as admin you keep the existing editor (create, edit, delete) until it is folded in.
export default function ProjectsPage() {
    return isAdmin() ? <ProjectsAdminPage /> : <ProjectsView />;
}

function ProjectsView() {
    usePageMeta('Projects', 'Software projects by Wolfi: web apps, tooling and infrastructure.');
    const [projects] = useApiList('/api/projects');
    const [technologies] = useApiList('/api/technologies');
    const [filter, setFilter] = useState('All');
    const tech = Object.fromEntries(technologies.map((t) => [t._id, t.tech]));
    const shown = projects.filter(
        (p) =>
            filter === 'All' ||
            (p.technologies || []).some((id) => (tech[id] || '').startsWith(filter)),
    );
    return (
        <div className="pw">
            <div className="page" style={{ padding: 0, maxWidth: 1040 }}>
                <header className="page-h">
                    <span className="kicker mono">Projects</span>
                    <h1>
                        Things I've <em>shipped</em>
                    </h1>
                    <p className="lead">
                        {projects.length} projects, from teaching tools to infrastructure. Filter by
                        stack.
                    </p>
                    <div className="chips">
                        {FILTERS.map((c) => (
                            <button
                                key={c}
                                className={filter === c ? 'on' : ''}
                                onClick={() => setFilter(c)}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                </header>
                <div className="grid2">
                    {shown.map((p) => (
                        <ProjectCard key={p._id} p={p} tech={tech} />
                    ))}
                </div>
                {shown.length === 0 && <p className="muted">Nothing with {filter} yet.</p>}
            </div>
        </div>
    );
}
