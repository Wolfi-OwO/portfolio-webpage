import { useEffect, useMemo, useReducer, useState } from 'react';
import { initialState, reducer } from './projectsReducer.js';
import { PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { authHeaders, isAdmin } from '../../utils/auth.js';
import { chipProps } from '../../utils/tech-color.js';
import { ProjectCard } from '../../components/design-bits.jsx';
import { rowSpans } from '../../components/project-layout.js';
import TailwindColorPicker from '../../components/TailwindColorPicker.jsx';
import { usePageMeta } from '../../hooks/usePageMeta.js';

export default function ProjectsPage() {
    usePageMeta(
        'Projects',
        'A selection of web applications, APIs, and UI-focused projects built with React, Node.js, and modern cloud technologies.',
    );

    const [state, dispatch] = useReducer(reducer, initialState);
    const [admin] = useState(() => isAdmin());

    useEffect(() => {
        async function loadProjects() {
            const response = await fetch('/api/projects?embed=(technologies)');
            if (!response.ok) return;
            const body = await response.json();
            dispatch({ type: 'SET_PROJECTS', payload: body.items });
        }

        async function loadTechnologies() {
            const response = await fetch('/api/technologies');
            if (!response.ok) return;
            const body = await response.json();
            dispatch({ type: 'SET_TECHNOLOGIES', payload: body.items });
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
                    throw new Error(
                        payload.message || `Failed to create technology "${selected.tech}".`,
                    );
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
                technologies: techIds.map((_id) => ({ _id })),
            };

            const isEdit = state.formMode === 'edit' && state.editingProjectId;
            const url = isEdit ? `/api/projects/${state.editingProjectId}` : '/api/projects';
            const method = isEdit ? 'PUT' : 'POST';

            const projectRes = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(body),
            });

            if (!projectRes.ok) {
                const payload = await projectRes.json().catch(() => ({}));
                throw new Error(
                    payload.message || `Failed to ${isEdit ? 'update' : 'create'} project.`,
                );
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

    // The editor shows the same image cards as the public page. Its projects carry full technology objects, the
    // card wants ids and a name lookup, so they are translated here.
    const techNames = {};
    const views = state.projects.map((project) => ({
        project,
        view: {
            ...project,
            technologies: (project.technologies || []).map((t) => {
                const key = t._id ?? t.tech;
                techNames[key] = t.tech;
                return key;
            }),
        },
    }));
    const spans = rowSpans(views.length);
    const cards = views.map((entry, i) => ({ ...entry, span: spans[i] }));

    return (
        <div className="animate-fade-up mx-auto w-full max-w-5xl space-y-8">
            <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-xl space-y-3">
                    <h1 className="text-4xl font-extrabold text-[var(--text)]">Projects</h1>

                    <p className="leading-7 text-[var(--muted)]">
                        In recent years, I have worked on multiple software engineering projects
                        ranging from web applications to backend systems and UI-focused platforms.
                    </p>
                </div>

                {admin && !state.formOpen && (
                    <button
                        type="button"
                        onClick={() => dispatch({ type: 'OPEN_FORM_NEW' })}
                        className="inline-flex cursor-pointer items-center gap-2 self-start rounded-lg bg-[var(--text)] px-4 py-2 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                        <PlusIcon className="h-4 w-4" />
                        New Project
                    </button>
                )}
            </section>

            {admin && state.formOpen && (
                <ProjectForm state={state} dispatch={dispatch} onSubmit={handleSubmit} />
            )}

            <div className="pw">
                <div className="pgrid">
                    {cards.map(({ project, view, span }) => (
                        <ProjectCard
                            key={project._id}
                            p={view}
                            tech={techNames}
                            span={span}
                            actions={
                                admin ? (
                                    <>
                                        <button
                                            type="button"
                                            aria-label={`Edit ${project.title}`}
                                            title="Edit"
                                            onClick={() =>
                                                dispatch({
                                                    type: 'OPEN_FORM_EDIT',
                                                    payload: project,
                                                })
                                            }
                                        >
                                            <PencilSquareIcon className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            className="danger"
                                            aria-label={`Delete ${project.title}`}
                                            title="Delete"
                                            onClick={() => handleDelete(project)}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </>
                                ) : null
                            }
                        />
                    ))}
                </div>
            </div>
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
        const selectedNames = new Set(form.selectedTechnologies.map((t) => t.tech.toLowerCase()));
        return technologies
            .filter((t) => !selectedNames.has(t.tech.toLowerCase()))
            .filter((t) => !lower || t.tech.toLowerCase().includes(lower))
            .slice(0, 8);
    }, [technologies, query, form.selectedTechnologies]);

    const exactMatchExists = useMemo(() => {
        if (!query) return true;
        const lower = query.toLowerCase();
        return (
            technologies.some((t) => t.tech.toLowerCase() === lower) ||
            form.selectedTechnologies.some((t) => t.tech.toLowerCase() === lower)
        );
    }, [technologies, query, form.selectedTechnologies]);

    const setField = (field, value) =>
        dispatch({ type: 'SET_FORM_FIELD', payload: { field, value } });

    return (
        <section className="max-w-10xl mx-auto px-6">
            <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                            {isEdit ? 'Edit Project' : 'New Project'}
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text)]">
                            {isEdit
                                ? 'Update an existing project'
                                : 'Add a project to the portfolio'}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={() => dispatch({ type: 'CLOSE_FORM' })}
                        aria-label="Close form"
                        className="cursor-pointer rounded-full p-2 text-[var(--muted)] transition hover:bg-[var(--bg)] hover:text-[var(--text)]"
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
                                onChange={(e) => setField('title', e.target.value)}
                                className={inputClass}
                                placeholder="My awesome project"
                                required
                            />
                        </Field>

                        <Field label="Repository URL" required>
                            <input
                                type="url"
                                value={form.repositoryUrl}
                                onChange={(e) => setField('repositoryUrl', e.target.value)}
                                className={inputClass}
                                placeholder="https://github.com/user/repo"
                                required
                            />
                        </Field>
                    </div>

                    <Field label="Description" required>
                        <textarea
                            value={form.description}
                            onChange={(e) => setField('description', e.target.value)}
                            className={`${inputClass} min-h-[6rem] resize-y`}
                            placeholder="Briefly describe what this project does."
                            required
                        />
                    </Field>

                    <Field label="Live demo URL">
                        <input
                            type="url"
                            value={form.livedemo}
                            onChange={(e) => setField('livedemo', e.target.value)}
                            className={inputClass}
                            placeholder="https://example.com (optional)"
                        />
                    </Field>

                    <div>
                        <p className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
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
                                                <span className="ml-1 rounded-full bg-white/40 px-1.5 text-2xs uppercase tracking-wider">
                                                    new
                                                </span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    dispatch({
                                                        type: 'REMOVE_SELECTED_TECH',
                                                        payload: index,
                                                    })
                                                }
                                                aria-label={`Remove ${t.tech}`}
                                                className="ml-1 inline-flex cursor-pointer items-center justify-center rounded-full hover:bg-black/10"
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
                            onBlur={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget)) {
                                    setTechOpen(false);
                                }
                            }}
                        >
                            <input
                                type="text"
                                value={form.techQuery}
                                onChange={(e) => setField('techQuery', e.target.value)}
                                className={inputClass}
                                placeholder="Search or create a technology..."
                            />

                            {techOpen && (filtered.length > 0 || (query && !exactMatchExists)) && (
                                <div className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-2xl border border-[var(--line)] bg-[var(--surface)] [box-shadow:var(--shadow-float)]">
                                    {filtered.map((tech) => {
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
                                                className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-[var(--bg)]"
                                            >
                                                <span
                                                    style={style}
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-black/10 dark:ring-white/10 ${className || ''}`}
                                                >
                                                    {tech.tech}
                                                </span>
                                                <span className="text-xs text-[var(--muted)]">
                                                    add
                                                </span>
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
                                                    payload: {
                                                        tech: query,
                                                        color: form.newTechColor,
                                                    },
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
                            className="rounded-2xl border border-[var(--down)] px-4 py-3 text-sm text-[var(--down)]"
                            style={{
                                background: 'color-mix(in srgb, var(--down) 10%, transparent)',
                            }}
                        >
                            {error}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => dispatch({ type: 'CLOSE_FORM' })}
                            className="inline-flex cursor-pointer items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex cursor-pointer items-center justify-center rounded-full bg-[var(--text)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting
                                ? isEdit
                                    ? 'Updating…'
                                    : 'Saving…'
                                : isEdit
                                  ? 'Save Changes'
                                  : 'Create Project'}
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
        <div className="border-t border-[var(--line)] p-3">
            <p className="text-xs text-[var(--muted)]">Create new technology</p>

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
                    className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-full bg-[var(--text)] px-3 py-1 text-xs font-semibold text-[var(--bg)] transition hover:opacity-90"
                >
                    <PlusIcon className="h-3.5 w-3.5" />
                    Create "{query}"
                </button>
            </div>

            <div className="mt-3">
                <TailwindColorPicker
                    value={color}
                    onChange={(value) => onColorChange('newTechColor', value)}
                />
            </div>
        </div>
    );
}

const inputClass =
    'mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--muted)] transition focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]';

function Field({ label, required, children }) {
    return (
        <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {label}
                {required && <span className="ml-1 text-[var(--down)]">*</span>}
            </span>
            {children}
        </label>
    );
}
