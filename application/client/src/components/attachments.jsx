import { useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { PaperClipIcon, TrashIcon } from '@heroicons/react/24/outline';
import { authHeaders } from '../utils/auth.js';

// What the server accepts (server/src/utils/attachment-rules.js); the input offers only these.
const ACCEPT = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/plain',
    '.docx',
    '.pptx',
    '.xlsx',
].join(',');

// The browser knows the type of a picked file; Office files are the only ones it may leave empty or odd.
const OFFICE = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};
const typeOf = (file) => file.type || OFFICE[file.name.split('.').pop().toLowerCase()] || '';

function formatBytes(n, locale) {
    const nf = (v, digits) =>
        new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(v);
    return n >= 1024 * 1024 ? `${nf(n / 1024 / 1024, 1)} MB` : `${nf(Math.max(1, n / 1024), 0)} KB`;
}

/** What a visitor sees under a career entry: each attachment as a link that opens the file. */
export function AttachmentList({ files }) {
    const { locale } = useIntl();
    if (!files?.length) return null;
    return (
        <ul className="cp-files" aria-label="Attachments">
            {files.map((f) => (
                <li key={f.id}>
                    <a href={`/api/attachments/${f.id}`} target="_blank" rel="noopener">
                        <PaperClipIcon className="h-4 w-4" aria-hidden="true" />
                        <span>{f.name}</span>
                        <small>{formatBytes(f.size, locale)}</small>
                    </a>
                </li>
            ))}
        </ul>
    );
}

/** The admin's side: add and remove the files of a saved entry. Changes happen at once, not on Save. */
export function AttachmentsEditor({ entryId, files = [], onChange }) {
    const intl = useIntl();
    const input = useRef(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    async function upload(event) {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        setBusy(true);
        setError('');
        try {
            const res = await fetch(`/api/availability/${entryId}/attachments`, {
                method: 'POST',
                headers: {
                    ...authHeaders(),
                    'Content-Type': typeOf(file),
                    'X-File-Name': encodeURIComponent(file.name),
                },
                body: file,
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(body.message || 'Upload failed.');
                return;
            }
            onChange([...files, body]);
        } catch {
            setError('Could not reach the server.');
        } finally {
            setBusy(false);
        }
    }

    async function remove(file) {
        if (!window.confirm(`Remove "${file.name}"?`)) return;
        setError('');
        try {
            const res = await fetch(`/api/attachments/${file.id}`, {
                method: 'DELETE',
                headers: authHeaders(),
            });
            if (!res.ok && res.status !== 204) {
                setError('Removing failed.');
                return;
            }
            onChange(files.filter((f) => f.id !== file.id));
        } catch {
            setError('Could not reach the server.');
        }
    }

    return (
        <fieldset className="space-y-2 border-t border-[var(--line)] pt-4">
            <legend className="text-sm font-semibold text-[var(--text)]">
                <FormattedMessage id="attachments.title" defaultMessage="Attachments" />
            </legend>
            {files.length === 0 && (
                <p className="text-xs text-[var(--muted)]">
                    <FormattedMessage
                        id="attachments.none"
                        defaultMessage="No files yet. Visitors can open what you add here."
                    />
                </p>
            )}
            <ul className="space-y-1">
                {files.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 text-sm text-[var(--text)]">
                        <PaperClipIcon
                            className="h-4 w-4 shrink-0 text-[var(--muted)]"
                            aria-hidden="true"
                        />
                        <a
                            href={`/api/attachments/${f.id}`}
                            target="_blank"
                            rel="noopener"
                            className="min-w-0 flex-1 truncate underline-offset-2 hover:underline"
                        >
                            {f.name}
                        </a>
                        <button
                            type="button"
                            onClick={() => remove(f)}
                            aria-label={intl.formatMessage(
                                { id: 'attachments.remove', defaultMessage: 'Remove {name}' },
                                { name: f.name },
                            )}
                            className="cursor-pointer rounded-md p-1.5 text-[var(--muted)] transition hover:text-[var(--down)]"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </li>
                ))}
            </ul>
            <input
                ref={input}
                type="file"
                accept={ACCEPT}
                onChange={upload}
                disabled={busy}
                className="sr-only"
                id={`attach-${entryId}`}
            />
            <label
                htmlFor={`attach-${entryId}`}
                className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--line)] px-3 text-xs font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)]"
            >
                <PaperClipIcon className="h-4 w-4" aria-hidden="true" />
                {busy ? (
                    <FormattedMessage id="attachments.uploading" defaultMessage="Uploading…" />
                ) : (
                    <FormattedMessage
                        id="attachments.add"
                        defaultMessage="Add a file (PDF, image, up to 10 MB)"
                    />
                )}
            </label>
            {error && <p className="text-xs text-[var(--down)]">{error}</p>}
        </fieldset>
    );
}
