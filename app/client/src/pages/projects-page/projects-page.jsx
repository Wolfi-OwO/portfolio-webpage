import { useEffect, useReducer } from 'react';
import { initialState, reducer } from './projectsReducer.js';

export default function ProjectsPage() {
    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        async function getProjects() {
            const response = await fetch('/api/projects?embed=(technologies)');

            if (!response.ok) {
                // throw an error or display a toast
            }

            const projects = await response.json();
            dispatch({
                type: 'SET_PROJECTS',
                payload: projects,
            });
        }

        getProjects();
    }, []);

    return (
        <div className="space-y-4 py-1 lg:py-2">
            <section className="mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between px-6">
                <div className="max-w-2xl space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Projects
                    </h1>

                    <p className="max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
                        In recent years, I have worked on multiple software
                        engineering projects ranging from web applications to backend
                        systems and UI-focused platforms.
                    </p>
                </div>
            </section>

            <section className="mx-auto grid max-w-10xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
                {state.projects.map((project, index) => (
                    <div
                        key={index}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                    >
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            {project.title}
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {project.description}
                        </p>

                        {project.livedemo && (
                            <div className="flex">
                                <span className="mt-3 text-sm text-slate-600 dark:text-slate-300 pr-2">
                                    Live Demo:
                                </span>
                                <a
                                    className="mt-3 text-sm font-semibold underline text-blue-600 hover:text-blue-800 visited:text-purple-600"
                                    href={project.livedemo}
                                    target="_blank"
                                >
                                    {project.livedemo}
                                </a>
                            </div>
                        )}

                        <ul className="mt-4 flex flex-wrap gap-2">
                            {project.technologies.map(
                                ({ tech, color }, techIndex) => (
                                    <li
                                        key={techIndex}
                                        className={`rounded-full px-3 py-1 text-xs font-medium ${color}`}
                                    >
                                        {tech}
                                    </li>
                                ),
                            )}
                        </ul>
                    </div>
                ))}
            </section>
        </div>
    );
}
