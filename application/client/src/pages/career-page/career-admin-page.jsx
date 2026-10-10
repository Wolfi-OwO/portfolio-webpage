import { useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { PlusIcon } from '@heroicons/react/24/outline';
import CareerChart from '../../components/career-chart.jsx';
import { CareerEntryForm } from '../../components/career-timeline.jsx';
import { usePageMeta } from '../../hooks/usePageMeta.js';
import { authHeaders } from '../../utils/auth.js';
import { EMPTY_FORM, toForm, toPayload } from '../../utils/career-form.js';

// The admin sees the same chart as visitors; every station carries its own edit and delete buttons, and the entry form opens above the
// chart. This replaces the old list-with-an-editor below the chart, which made the page look like the old design.
export default function CareerAdminPage() {
    const intl = useIntl();
    const [entries, setEntries] = useState([]);
    const [technologies, setTechnologies] = useState([]);
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    usePageMeta(
        intl.formatMessage({ id: 'career.meta.title', defaultMessage: 'Career' }),
        intl.formatMessage({
            id: 'career.meta.description',
            defaultMessage:
                'Work experience and education of Wolfi, a freelance full-stack developer from Villach, Austria.',
        }),
    );

    useEffect(() => {
        let active = true;
        // Admin token: unpublished entries are included so they can be edited and published.
        fetch('/api/availability?track=career', { headers: authHeaders() })
            .then((res) => (res.ok ? res.json() : { items: [] }))
            .then((body) => active && setEntries(body.items))
            .catch(() => active && setError('Could not load the career entries.'));
        fetch('/api/technologies')
            .then((res) => (res.ok ? res.json() : { items: [] }))
            .then((body) => active && setTechnologies(body.items))
            .catch(() => {
                // the tag picker just stays empty
            });
        return () => {
            active = false;
        };
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        if (!form.title.trim() || !form.startDate) {
            setError(
                intl.formatMessage({
                    id: 'career.error.required',
                    defaultMessage: 'Title and start date are required.',
                }),
            );
            return;
        }
        if (form.endDate && form.endDate < form.startDate) {
            setError(
                intl.formatMessage({
                    id: 'career.error.dateOrder',
                    defaultMessage: 'The end date cannot be before the start date.',
                }),
            );
            return;
        }
        setSaving(true);
        setError('');
        const editing = Boolean(form._id);
        try {
            const res = await fetch(
                editing ? `/api/availability/${form._id}` : '/api/availability',
                {
                    method: editing ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                    body: JSON.stringify(toPayload(form, technologies)),
                },
            );
            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                setError(payload.message || 'Saving failed.');
                return;
            }
            const saved = await res.json();
            setEntries((current) =>
                editing
                    ? current.map((e) => (e._id === saved._id ? saved : e))
                    : [...current, saved],
            );
            setForm(null);
        } catch {
            setError('Could not reach the server.');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(entry) {
        if (!window.confirm(`Delete "${entry.title}"?`)) return;
        try {
            const res = await fetch(`/api/availability/${entry._id}`, {
                method: 'DELETE',
                headers: { ...authHeaders() },
            });
            if (!res.ok && res.status !== 204) {
                setError('Deleting failed.');
                return;
            }
            setEntries((current) => current.filter((e) => e._id !== entry._id));
        } catch {
            setError('Could not reach the server.');
        }
    }

    return (
        <div className="mx-auto max-w-5xl">
            <h1 className="sr-only">
                <FormattedMessage id="career.heading" defaultMessage="Career & Education" />
            </h1>
            {!form && (
                <button
                    type="button"
                    onClick={() => setForm({ ...EMPTY_FORM })}
                    className="mb-3 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
                >
                    <PlusIcon className="h-3.5 w-3.5" />
                    <FormattedMessage id="career.new" defaultMessage="New entry" />
                </button>
            )}
            {error && (
                <p className="mb-3 rounded-lg border border-[var(--down)] px-4 py-2 text-sm text-[var(--down)]">
                    {error}
                </p>
            )}
            {form && (
                <CareerEntryForm
                    form={form}
                    setForm={setForm}
                    saving={saving}
                    technologies={technologies}
                    onSubmit={handleSubmit}
                    onCancel={() => {
                        setForm(null);
                        setError('');
                    }}
                />
            )}
            <div className="pw">
                <CareerChart
                    entries={entries}
                    admin
                    onEdit={(entry) => setForm(toForm(entry))}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}
