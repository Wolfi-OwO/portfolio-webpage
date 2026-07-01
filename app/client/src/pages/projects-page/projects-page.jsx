import { useEffect, useMemo, useReducer, useState } from 'react';
import { initialState, reducer } from './projectsReducer.js';
import { FormattedDate } from 'react-intl';
import {
    ArrowTopRightOnSquareIcon,
    ClockIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { authHeaders, isAdmin } from '../../utils/auth.js';
import { chipProps } from '../../utils/tech-color.js';
import TailwindColorPicker from '../../components/TailwindColorPicker.jsx';

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

            const body = {
                title,
                description,
                repositoryUrl,
                livedemo: livedemo || undefined,
                technologies: techIds.map(_id => ({ _id })),
            };

            const isEdit = state.formMode === 'edit' && state.editingProjectId;
            const url = isEdit
                ? `/api/projects/${state.editingProjectId}`
                : '/api/projects';
            const method = isEdit ? 'PUT' : 'POST';

            const projectRes = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(body),
            });

            if (!projectRes.ok) {
                const payload = await projectRes.json().catch(() => ({}));
                throw new Error(payload.message || `Failed to ${isEdit ? 'update' : 'create'} project.`);
            }

            const saved = await projectRes.json();
            dispatch({ type: isEdit ? 'UPDATE_PROJECT' : 'ADD_PROJECT', payload: saved });
            dispatch({ type: 'SUBMIT_SUCCESS' });
        } catch (err) {
            dispatch({ type: 'SUBMIT_ERROR', payload: err.message || 'Submission failed.' });
        }
    }

    async function handleDelete(project) {
        const confirmed = window.confirm(`Delete "${project.title}"? This cannot be undone.`);
        if (!confirmed) return;

        try {
            const res = await fetch(`/api/projects/${project._id}`, {
                method: 'DELETE',
                headers: { ...authHeaders() },
            });

            if (!res.ok && res.status !== 204) {
                const payload = await res.json().catch(() => ({}));
                window.alert(payload.message || 'Failed to delete project.');
                return;
            }

            dispatch({ type: 'REMOVE_PROJECT', payload: project._id });
        } catch (_err) {
            window.alert('Could not reach the server.');
        }
    }

    return (
        <div className="space-y-4 py-1 lg:py-2 w-full">
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
                        onClick={() => dispatch({ type: 'OPEN_FORM_NEW' })}
                        className="inline-flex items-center gap-2 self-start rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    >
                        <PlusIcon className="h-4 w-4" />
                        New Project
                    </button>
                )}
            </section>

            {admin && state.formOpen && (
                <ProjectForm state={state} dispatch={dispatch} onSubmit={handleSubmit} />
            )}

            <section className="mx-auto grid max-w-10xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-3">
                {state.projects.map(project => (
                    <ProjectCard
                        key={project._id}
                        project={project}
                        admin={admin}
                        onEdit={() => dispatch({ type: 'OPEN_FORM_EDIT', payload: project })}
                        onDelete={() => handleDelete(project)}
                    />
                ))}
            </section>
        </div>
    );
}

function liveDemoLabel(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

function ProjectCard({ project, admin, onEdit, onDelete }) {
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

                <div className="flex items-center gap-1">
                    {admin && (
                        <>
                            <button
                                type="button"
                                onClick={event => { event.stopPropagation(); onEdit(); }}
                                aria-label={`Edit ${project.title}`}
                                title="Edit"
                                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={event => { event.stopPropagation(); onDelete(); }}
                                aria-label={`Delete ${project.title}`}
                                title="Delete"
                                className="rounded-full p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </>
                    )}

                    {hasRepo && (
                        <ArrowTopRightOnSquareIcon
                            aria-hidden="true"
                            className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-950 dark:text-slate-500 dark:group-hover:text-white"
                        />
                    )}
                </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300 flex-1">
                {project.description}
            </p>

            {project.livedemo && (
                <div className="mt-3 flex min-w-0 items-center gap-2 text-sm">
                    <span className="shrink-0 text-slate-600 dark:text-slate-300">
                        Live Demo:
                    </span>
                    <a
                        className="truncate font-semibold underline text-blue-600 hover:text-blue-800 dark:text-sky-400 dark:hover:text-sky-300"
                        href={project.livedemo}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={project.livedemo}
                        onClick={event => event.stopPropagation()}
                    >
                        {liveDemoLabel(project.livedemo)}
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
                {project.technologies.map(({ tech, color }, techIndex) => {
                    const { className, style } = chipProps(color);
                    return (
                        <li
                            key={techIndex}
                            style={style}
                            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-black/10 dark:ring-white/10 ${className || ''}`}
                        >
                            {tech}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function ProjectForm({ state, dispatch, onSubmit }) {
    const { form, technologies, submitting, error, formMode } = state;
    const query = form.techQuery.trim();
    const isEdit = formMode === 'edit';
    const [techOpen, setTechOpen] = useState(false);

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
                            {isEdit ? 'Edit Project' : 'New Project'}
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                            {isEdit ? 'Update an existing project' : 'Add a project to the portfolio'}
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
                                {form.selectedTechnologies.map((t, index) => {
                                    const { className, style } = chipProps(t.color);
                                    return (
                                        <li
                                            key={index}
                                            style={style}
                                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-black/10 dark:ring-white/10 ${className || ''}`}
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
                                    );
                                })}
                            </ul>
                        )}

                        <div
                            className="relative mt-2"
                            onFocus={() => setTechOpen(true)}
                            onBlur={e => {
                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                    setTechOpen(false);
                                }
                            }}
                        >
                            <input
                                type="text"
                                value={form.techQuery}
                                onChange={e => setField('techQuery', e.target.value)}
                                className={inputClass}
                                placeholder="Search or create a technology..."
                            />

                            {techOpen && (filtered.length > 0 || (query && !exactMatchExists)) && (
                                <div className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
                                    {filtered.map(tech => {
                                        const { className, style } = chipProps(tech.color);
                                        return (
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
                                                <span
                                                    style={style}
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-black/10 dark:ring-white/10 ${className || ''}`}
                                                >
                                                    {tech.tech}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500">add</span>
                                            </button>
                                        );
                                    })}

                                    {query && !exactMatchExists && (
                                        <NewTechRow
                                            query={query}
                                            color={form.newTechColor}
                                            onColorChange={setField}
                                            onCreate={() =>
                                                dispatch({
                                                    type: 'ADD_SELECTED_TECH',
                                                    payload: { tech: query, color: form.newTechColor },
                                                })
                                            }
                                        />
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
                            {submitting ? (isEdit ? 'Updating…' : 'Saving…') : (isEdit ? 'Save Changes' : 'Create Project')}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}

function NewTechRow({ query, color, onColorChange, onCreate }) {
    const previewProps = chipProps(color);

    return (
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">Create new technology</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                    style={previewProps.style}
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-black/10 dark:ring-white/10 ${previewProps.className || ''}`}
                >
                    {query}
                </span>

                <button
                    type="button"
                    onClick={onCreate}
                    className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Create "{query}"
                </button>
            </div>

            <div className="mt-3">
                <TailwindColorPicker value={color} onChange={value => onColorChange('newTechColor', value)} />
            </div>
        </div>
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
