import { useEffect, useMemo, useReducer, useState } from 'react';
import { initialState, reducer, TECH_COLOR_PRESETS } from './projectsReducer.js';
import { FormattedDate } from 'react-intl';
import {
    ArrowTopRightOnSquareIcon,
    ClockIcon,
    PlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { authHeaders, isAdmin } from '../../utils/auth.js';

export default function ProjectsPage() {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [admin] = useState(() => isAdmin());

    useEffect(() => {
        async function loadProjects() {
            const response = await fetch('/api/projects?embed=(technologies)');
            if (!response.ok) return;
            const projects = await response.json();
            dispatch({ type: 'SET_PROJECTS', payload: projects });
        }

        async function loadTechnologies() {
            const response = await fetch('/api/technologies');
            if (!response.ok) return;
            const technologies = await response.json();
            dispatch({ type: 'SET_TECHNOLOGIES', payload: technologies });
        }

        loadProjects();
        loadTechnologies();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        const { title, description, repositoryUrl, livedemo, selectedTechnologies } = state.form;

        if (!title || !description || !repositoryUrl) {
            dispatch({
                type: 'SUBMIT_ERROR',
                payload: 'Title, description and repository URL are required.',
            });
            return;
        }

        dispatch({ type: 'SUBMIT_START' });

        try {
            const techIds = [];

            for (const selected of selectedTechnologies) {
                if (selected._id) {
                    techIds.push(selected._id);
                    continue;
                }

                const createRes = await fetch('/api/technologies', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                    body: JSON.stringify({ tech: selected.tech, color: selected.color }),
                });

                if (!createRes.ok) {
                    const payload = await createRes.json().catch(() => ({}));
                    throw new Error(payload.message || `Failed to create technology "${selected.tech}".`);
                }

                const created = await createRes.json();
                dispatch({ type: 'ADD_TECHNOLOGY', payload: created });
                techIds.push(created._id);
            }

            const projectRes = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({
                    title,
                    description,
                    repositoryUrl,
                    livedemo: livedemo || undefined,
                    technologies: techIds.map(_id => ({ _id })),
                }),
            });

            if (!projectRes.ok) {
                const payload = await projectRes.json().catch(() => ({}));
                throw new Error(payload.message || 'Failed to create project.');
            }

            const newProject = await projectRes.json();
            dispatch({ type: 'ADD_PROJECT', payload: newProject });
            dispatch({ type: 'SUBMIT_SUCCESS' });
        } catch (err) {
            dispatch({ type: 'SUBMIT_ERROR', payload: err.message || 'Submission failed.' });
        }
    }

    return (
        <div className="space-y-4 py-1 lg:py-2">
            <section className="mx-auto flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between px-6">
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

                {admin && !state.formOpen && (
                    <button
                        type="button"
                        onClick={() => dispatch({ type: 'OPEN_FORM' })}
                        className="inline-flex items-center gap-2 self-start rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                        <PlusIcon className="h-4 w-4" />
                        New Project
                    </button>
                )}
            </section>

            {admin && state.formOpen && (
                <NewProjectForm
                    state={state}
                    dispatch={dispatch}
                    onSubmit={handleSubmit}
                />
            )}

            <section className="mx-auto grid max-w-10xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
                {state.projects.map((project, index) => {
                    const hasRepo = Boolean(project.repositoryUrl);

                    const openRepo = () => {
                        if (hasRepo) {
                            window.open(project.repositoryUrl, '_blank', 'noopener,noreferrer');
                        }
                    };

                    const onKeyDown = event => {
                        if (!hasRepo) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openRepo();
                        }
                    };

                    return (
                        <div
                            key={index}
                            role={hasRepo ? 'link' : undefined}
                            tabIndex={hasRepo ? 0 : undefined}
                            onClick={hasRepo ? openRepo : undefined}
                            onKeyDown={hasRepo ? onKeyDown : undefined}
                            aria-label={hasRepo ? `Open repository for ${project.title}` : undefined}
                            className={`group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition dark:border-slate-800 dark:bg-slate-900 ${
                                hasRepo
                                    ? 'cursor-pointer hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 dark:hover:border-slate-700 dark:focus-visible:ring-white'
                                    : ''
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                                    {project.title}
                                </h2>

                                {hasRepo && (
                                    <ArrowTopRightOnSquareIcon
                                        aria-hidden="true"
                                        className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-950 dark:text-slate-500 dark:group-hover:text-white"
                                    />
                                )}
                            </div>

                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 flex-1">
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
                                        rel="noopener noreferrer"
                                        onClick={event => event.stopPropagation()}
                                    >
                                        {project.livedemo}
                                    </a>
                                </div>
                            )}

                            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1"/>
                                <FormattedDate
                                    value={project.createdAt}
                                    year="numeric"
                                    month="long"
                                    day="numeric"
                                    hour="2-digit"
                                    minute="2-digit"
                                />
                            </p>

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
                    );
                })}
            </section>
        </div>
    );
}

function NewProjectForm({ state, dispatch, onSubmit }) {
    const { form, technologies, submitting, error } = state;
    const query = form.techQuery.trim();

    const filtered = useMemo(() => {
        const lower = query.toLowerCase();
        const selectedNames = new Set(
            form.selectedTechnologies.map(t => t.tech.toLowerCase()),
        );
        return technologies
            .filter(t => !selectedNames.has(t.tech.toLowerCase()))
            .filter(t => !lower || t.tech.toLowerCase().includes(lower))
            .slice(0, 8);
    }, [technologies, query, form.selectedTechnologies]);

    const exactMatchExists = useMemo(() => {
        if (!query) return true;
        const lower = query.toLowerCase();
        return (
            technologies.some(t => t.tech.toLowerCase() === lower) ||
            form.selectedTechnologies.some(t => t.tech.toLowerCase() === lower)
        );
    }, [technologies, query, form.selectedTechnologies]);

    const setField = (field, value) =>
        dispatch({ type: 'SET_FORM_FIELD', payload: { field, value } });

    return (
        <section className="mx-auto max-w-10xl px-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                            New Project
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                            Add a project to the portfolio
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={() => dispatch({ type: 'CLOSE_FORM' })}
                        aria-label="Close form"
                        className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Title" required>
                            <input
                                type="text"
                                value={form.title}
                                onChange={e => setField('title', e.target.value)}
                                className={inputClass}
                                placeholder="My awesome project"
                                required
                            />
                        </Field>

                        <Field label="Repository URL" required>
                            <input
                                type="url"
                                value={form.repositoryUrl}
                                onChange={e => setField('repositoryUrl', e.target.value)}
                                className={inputClass}
                                placeholder="https://github.com/user/repo"
                                required
                            />
                        </Field>
                    </div>

                    <Field label="Description" required>
                        <textarea
                            value={form.description}
                            onChange={e => setField('description', e.target.value)}
                            className={`${inputClass} min-h-[6rem] resize-y`}
                            placeholder="Briefly describe what this project does."
                            required
                        />
                    </Field>

                    <Field label="Live demo URL">
                        <input
                            type="url"
                            value={form.livedemo}
                            onChange={e => setField('livedemo', e.target.value)}
                            className={inputClass}
                            placeholder="https://example.com (optional)"
                        />
                    </Field>

                    <div>
                        <p className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Technologies
                        </p>

                        {form.selectedTechnologies.length > 0 && (
                            <ul className="mt-2 flex flex-wrap gap-2">
                                {form.selectedTechnologies.map((t, index) => (
                                    <li
                                        key={index}
                                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${t.color}`}
                                    >
                                        {t.tech}
                                        {!t._id && (
                                            <span className="ml-1 rounded-full bg-white/40 px-1.5 text-[10px] uppercase tracking-wider">
                                                new
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                dispatch({ type: 'REMOVE_SELECTED_TECH', payload: index })
                                            }
                                            aria-label={`Remove ${t.tech}`}
                                            className="ml-1 inline-flex items-center justify-center rounded-full hover:bg-black/10"
                                        >
                                            <XMarkIcon className="h-3.5 w-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="relative mt-2">
                            <input
                                type="text"
                                value={form.techQuery}
                                onChange={e => setField('techQuery', e.target.value)}
                                className={inputClass}
                                placeholder="Search or create a technology..."
                            />

                            {(filtered.length > 0 || (query && !exactMatchExists)) && (
                                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                                    {filtered.map(tech => (
                                        <button
                                            type="button"
                                            key={tech._id}
                                            onClick={() =>
                                                dispatch({
                                                    type: 'ADD_SELECTED_TECH',
                                                    payload: {
                                                        _id: tech._id,
                                                        tech: tech.tech,
                                                        color: tech.color,
                                                    },
                                                })
                                            }
                                            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800"
                                        >
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tech.color}`}>
                                                {tech.tech}
                                            </span>
                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                add
                                            </span>
                                        </button>
                                    ))}

                                    {query && !exactMatchExists && (
                                        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Create new technology
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${form.newTechColor}`}
                                                >
                                                    {query}
                                                </span>

                                                <div className="flex flex-wrap items-center gap-1">
                                                    {TECH_COLOR_PRESETS.map(preset => {
                                                        const active = preset.value === form.newTechColor;
                                                        return (
                                                            <button
                                                                key={preset.value}
                                                                type="button"
                                                                onClick={() => setField('newTechColor', preset.value)}
                                                                aria-label={preset.label}
                                                                title={preset.label}
                                                                className={`h-5 w-5 rounded-full border transition ${preset.value.split(' ')[0]} ${
                                                                    active
                                                                        ? 'border-slate-950 ring-2 ring-slate-950/30 dark:border-white dark:ring-white/30'
                                                                        : 'border-transparent hover:border-slate-400'
                                                                }`}
                                                            />
                                                        );
                                                    })}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        dispatch({
                                                            type: 'ADD_SELECTED_TECH',
                                                            payload: {
                                                                tech: query,
                                                                color: form.newTechColor,
                                                            },
                                                        })
                                                    }
                                                    className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                                                >
                                                    <PlusIcon className="h-3.5 w-3.5" />
                                                    Create "{query}"
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                        >
                            {error}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => dispatch({ type: 'CLOSE_FORM' })}
                            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                        >
                            {submitting ? 'Saving…' : 'Create Project'}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}

const inputClass =
    'mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-950 placeholder-slate-400 transition focus:border-slate-950 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-950/10 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-white dark:focus:bg-slate-900 dark:focus:ring-white/10';

function Field({ label, required, children }) {
    return (
        <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </span>
            {children}
        </label>
    );
}
