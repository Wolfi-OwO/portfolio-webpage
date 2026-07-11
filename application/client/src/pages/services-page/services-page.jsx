import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import {
    CheckIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { authHeaders, isAdmin } from '../../utils/auth.js';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { IDENTITY } from '../../utils/identity.js';

const CATEGORIES = [
    { id: 'web', labelId: 'services.category.web', defaultLabel: 'Web' },
    { id: 'mobile', labelId: 'services.category.mobile', defaultLabel: 'Mobile' },
    { id: 'desktop', labelId: 'services.category.desktop', defaultLabel: 'Desktop' },
    { id: 'other', labelId: 'services.category.other', defaultLabel: 'Other' },
];

const EMPTY_FORM = {
    _id: null,
    title: '',
    description: '',
    category: 'web',
    deliverables: '',
    priceFrom: 0,
    hourlyRate: 30,
    duration: '',
    order: 0,
    published: true,
};

/** The API stores deliverables as an array; the form edits them as one line per item. */
function toForm(service) {
    return {
        ...EMPTY_FORM,
        ...service,
        deliverables: (service.deliverables || []).join('\n'),
    };
}

function toPayload(form) {
    return {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        deliverables: form.deliverables
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
        priceFrom: Number(form.priceFrom) || 0,
        hourlyRate: Number(form.hourlyRate) || 0,
        duration: form.duration.trim(),
        order: Number(form.order) || 0,
        published: Boolean(form.published),
    };
}

export default function ServicesPage() {
    const intl = useIntl();

    usePageMeta(
        'Services',
        'Websites, web apps, Android apps in Kotlin and desktop GUIs with JavaFX or .NET — what I build, and what it costs.',
    );

    const [services, setServices] = useState([]);
    const [admin] = useState(() => isAdmin());
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;

        fetch('/api/services')
            .then((res) => (res.ok ? res.json() : []))
            .then((list) => {
                if (active) setServices(list);
            })
            .catch(() => {
                if (active) setError('Could not load services.');
            });

        return () => {
            active = false;
        };
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        if (!form.title.trim() || !form.description.trim()) {
            setError(
                intl.formatMessage({
                    id: 'services.error.required',
                    defaultMessage: 'Title and description are required.',
                }),
            );
            return;
        }

        setSaving(true);
        setError('');

        const editing = Boolean(form._id);
        const url = editing ? `/api/services/${form._id}` : '/api/services';

        try {
            const res = await fetch(url, {
                method: editing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify(toPayload(form)),
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                setError(payload.message || 'Saving failed.');
                return;
            }

            const saved = await res.json();

            setServices((current) => {
                const next = editing
                    ? current.map((s) => (s._id === saved._id ? saved : s))
                    : [...current, saved];

                return next.sort((a, b) => a.order - b.order || a.priceFrom - b.priceFrom);
            });

            setForm(null);
        } catch (_err) {
            setError('Could not reach the server.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(service) {
        if (!window.confirm(`Delete "${service.title}"?`)) return;

        try {
            const res = await fetch(`/api/services/${service._id}`, {
                method: 'DELETE',
                headers: { ...authHeaders() },
            });

            if (!res.ok && res.status !== 204) {
                setError('Deleting failed.');
                return;
            }

            setServices((current) => current.filter((s) => s._id !== service._id));
        } catch (_err) {
            setError('Could not reach the server.');
        }
    }

    // Visitors only ever see published entries; I see the drafts too, marked as such.
    const visible = admin ? services : services.filter((s) => s.published);
    const rate = services.find((s) => s.hourlyRate)?.hourlyRate;

    return (
        <div className="animate-fade-up mx-auto w-full max-w-5xl">
            <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                    <p className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                        <FormattedMessage id="services.label" defaultMessage="What I build" />
                    </p>

                    <h1 className="mt-4 text-4xl font-extrabold text-[var(--text)]">
                        <FormattedMessage id="services.title" defaultMessage="Services" />
                    </h1>

                    <p className="mt-4 leading-7 text-[var(--muted)]">
                        <FormattedMessage
                            id="services.intro"
                            defaultMessage="Websites, web applications, Android apps in Kotlin and desktop interfaces with JavaFX or .NET. The prices below are starting points, not quotes — what a project really costs depends on what it has to do, and I would rather tell you that honestly after a conversation than pretend a number on a page can know it."
                        />
                    </p>
                </div>

                {admin && !form && (
                    <button
                        type="button"
                        onClick={() => setForm({ ...EMPTY_FORM })}
                        className="inline-flex items-center gap-2 self-start rounded-lg bg-[var(--text)] px-4 py-2 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                    >
                        <PlusIcon className="h-4 w-4" />
                        <FormattedMessage id="services.new" defaultMessage="New service" />
                    </button>
                )}
            </section>

            {rate ? (
                <p className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 py-2 font-mono text-sm text-[var(--muted)]">
                    <FormattedMessage
                        id="services.hourlyRate"
                        defaultMessage="Hourly rate: {rate} € / h"
                        values={{ rate }}
                    />
                </p>
            ) : null}

            {error && (
                <p className="mt-6 rounded-lg border border-[var(--down)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--down)]">
                    {error}
                </p>
            )}

            {admin && form && (
                <ServiceForm
                    form={form}
                    setForm={setForm}
                    saving={saving}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setForm(null);
                        setError('');
                    }}
                />
            )}

            <section className="mt-10 grid gap-5 sm:grid-cols-2">
                {visible.map((service) => (
                    <ServiceCard
                        key={service._id}
                        service={service}
                        admin={admin}
                        onEdit={() => setForm(toForm(service))}
                        onDelete={() => handleDelete(service)}
                    />
                ))}
            </section>

            <section className="mt-12 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
                <h2 className="text-xl font-bold text-[var(--accent)]">
                    <FormattedMessage
                        id="services.cta.title"
                        defaultMessage="Not sure which of these you need?"
                    />
                </h2>

                <p className="mt-3 leading-7 text-[var(--text)]">
                    <FormattedMessage
                        id="services.cta.text"
                        defaultMessage="Describe what you want to happen, and I will tell you what it takes to build it — including when it is not worth building. Note that I am on an internship until the end of September and with the Bundesheer until April 2027, so larger projects realistically start after that; small work in between is possible."
                    />
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        to="/contact"
                        className="rounded-md bg-[var(--text)] px-4 py-2 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90"
                    >
                        <FormattedMessage id="services.cta.button" defaultMessage="Get in touch" />
                    </Link>

                    <a
                        href={`mailto:${IDENTITY.email}`}
                        className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]"
                    >
                        {IDENTITY.email}
                    </a>
                </div>
            </section>
        </div>
    );
}

function ServiceCard({ service, admin, onEdit, onDelete }) {
    const category = CATEGORIES.find((c) => c.id === service.category);

    return (
        <article className="flex flex-col rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 transition hover:border-[var(--accent)]">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-mono text-2xs uppercase tracking-[0.2em] text-[var(--accent)]">
                        {category && (
                            <FormattedMessage
                                id={category.labelId}
                                defaultMessage={category.defaultLabel}
                            />
                        )}
                        {!service.published && ' · draft'}
                    </p>

                    <h2 className="mt-2 text-xl font-bold text-[var(--text)]">{service.title}</h2>
                </div>

                {admin && (
                    <div className="flex shrink-0 gap-1">
                        <button
                            type="button"
                            onClick={onEdit}
                            aria-label={`Edit ${service.title}`}
                            className="rounded-md border border-[var(--line)] p-1.5 text-[var(--muted)] transition hover:text-[var(--text)]"
                        >
                            <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            aria-label={`Delete ${service.title}`}
                            className="rounded-md border border-[var(--line)] p-1.5 text-[var(--muted)] transition hover:text-[var(--down)]"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{service.description}</p>

            {service.deliverables?.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                    {service.deliverables.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-[var(--text)]">
                            <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--live)]" />
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            )}

            <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-[var(--line)] pt-4">
                <p className="font-mono text-sm text-[var(--text)]">
                    {service.priceFrom > 0 ? (
                        <FormattedMessage
                            id="services.priceFrom"
                            defaultMessage="from {price} €"
                            values={{ price: service.priceFrom }}
                        />
                    ) : (
                        <FormattedMessage
                            id="services.byTheHour"
                            defaultMessage="{rate} € / h"
                            values={{ rate: service.hourlyRate }}
                        />
                    )}
                </p>

                {service.duration && (
                    <p className="font-mono text-2xs uppercase tracking-wider text-[var(--muted)]">
                        {service.duration}
                    </p>
                )}
            </div>
        </article>
    );
}

function ServiceForm({ form, setForm, saving, onSubmit, onCancel }) {
    const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

    return (
        <form
            onSubmit={onSubmit}
            className="mt-8 space-y-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text)]">
                    {form._id ? (
                        <FormattedMessage id="services.form.edit" defaultMessage="Edit service" />
                    ) : (
                        <FormattedMessage id="services.form.new" defaultMessage="New service" />
                    )}
                </h2>

                <button
                    type="button"
                    onClick={onCancel}
                    aria-label="Close"
                    className="rounded-md border border-[var(--line)] p-1.5 text-[var(--muted)] transition hover:text-[var(--text)]"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Title" required>
                    <input
                        value={form.title}
                        onChange={(e) => set('title', e.target.value)}
                        className={INPUT}
                    />
                </Field>

                <Field label="Category">
                    <select
                        value={form.category}
                        onChange={(e) => set('category', e.target.value)}
                        className={INPUT}
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.defaultLabel}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>

            <Field label="Description" required>
                <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={3}
                    className={INPUT}
                />
            </Field>

            <Field label="Deliverables (one per line)">
                <textarea
                    value={form.deliverables}
                    onChange={(e) => set('deliverables', e.target.value)}
                    rows={4}
                    className={`${INPUT} font-mono text-sm`}
                />
            </Field>

            <div className="grid gap-5 sm:grid-cols-4">
                <Field label="From (€)">
                    <input
                        type="number"
                        min="0"
                        value={form.priceFrom}
                        onChange={(e) => set('priceFrom', e.target.value)}
                        className={INPUT}
                    />
                </Field>

                <Field label="Hourly rate (€)">
                    <input
                        type="number"
                        min="0"
                        value={form.hourlyRate}
                        onChange={(e) => set('hourlyRate', e.target.value)}
                        className={INPUT}
                    />
                </Field>

                <Field label="Duration">
                    <input
                        value={form.duration}
                        onChange={(e) => set('duration', e.target.value)}
                        placeholder="2–4 weeks"
                        className={INPUT}
                    />
                </Field>

                <Field label="Order">
                    <input
                        type="number"
                        value={form.order}
                        onChange={(e) => set('order', e.target.value)}
                        className={INPUT}
                    />
                </Field>
            </div>

            <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => set('published', e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--line)]"
                />
                Published
            </label>

            <div className="flex gap-3 border-t border-[var(--line)] pt-5">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-md bg-[var(--text)] px-4 py-2 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90 disabled:opacity-50"
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>

                <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:border-[var(--accent)]"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

const INPUT =
    'w-full rounded-md border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)]';

function Field({ label, required, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                {label}
                {required && <span className="text-[var(--down)]"> *</span>}
            </span>
            {children}
        </label>
    );
}
