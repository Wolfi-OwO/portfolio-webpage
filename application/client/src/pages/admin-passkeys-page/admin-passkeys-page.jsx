import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from '../../i18n/router-links.jsx';
import { KeyIcon, TrashIcon } from '@heroicons/react/24/outline';
import { isAdmin } from '../../utils/auth.js';
import {
    addPasskey,
    listPasskeys,
    passkeysSupported,
    removePasskey,
} from '../../utils/passkeys.js';
import { FIELD } from '../../components/field-classes.js';
import { useNoIndex } from '../../hooks/useNoIndex.js';

const BUTTON =
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-[var(--line)] px-4 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60';

const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : 'never');

export default function AdminPasskeysPage() {
    useNoIndex();
    const navigate = useNavigate();
    const [passkeys, setPasskeys] = useState([]);
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const refresh = useCallback(async () => {
        try {
            setPasskeys(await listPasskeys());
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        if (!isAdmin()) {
            navigate('/admin/login');
            return;
        }
        listPasskeys()
            .then(setPasskeys)
            .catch((err) => setError(err.message));
    }, [navigate]);

    async function handleAdd(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            await addPasskey(name);
            setName('');
            await refresh();
        } catch (err) {
            // The browser's own cancel is not an error worth showing.
            if (err?.name !== 'NotAllowedError')
                setError(err.message || 'Could not add the passkey.');
        } finally {
            setBusy(false);
        }
    }

    async function handleRemove(id) {
        setError('');
        try {
            await removePasskey(id);
            await refresh();
        } catch (err) {
            setError(err.message);
        }
    }

    return (
        <div className="mx-auto w-full max-w-xl px-6 py-10 lg:py-14">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                Admin area
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">
                Passkeys
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                A passkey signs in without the password. Keep the password too, it is the way back
                if a device is lost.
            </p>

            <ul className="mt-8 divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-[var(--surface)]">
                {passkeys.length === 0 && (
                    <li className="px-5 py-4 text-sm text-[var(--muted)]">No passkeys yet.</li>
                )}
                {passkeys.map((p) => (
                    <li key={p.id} className="flex items-center gap-3 px-5 py-4">
                        <KeyIcon
                            className="h-5 w-5 shrink-0 text-[var(--accent)]"
                            aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[var(--text)]">
                                {p.name}
                            </p>
                            <p className="text-xs text-[var(--muted)]">
                                Added {formatDate(p.createdAt)} · last used{' '}
                                {formatDate(p.lastUsedAt)}
                                {p.backedUp ? ' · synced' : ''}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleRemove(p.id)}
                            aria-label={`Remove ${p.name}`}
                            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-md text-[var(--muted)] transition hover:text-[var(--down)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        >
                            <TrashIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </li>
                ))}
            </ul>

            {passkeysSupported() ? (
                <form className="mt-6 flex gap-3" onSubmit={handleAdd}>
                    <label htmlFor="passkey-name" className="sr-only">
                        Name for the new passkey
                    </label>
                    <input
                        id="passkey-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={60}
                        placeholder="Laptop, phone, security key"
                        className={`${FIELD} flex-1 px-4 py-2.5`}
                    />
                    <button type="submit" disabled={busy} className={BUTTON}>
                        <KeyIcon className="h-5 w-5" aria-hidden="true" />
                        Add passkey
                    </button>
                </form>
            ) : (
                <p className="mt-6 text-sm text-[var(--muted)]">
                    This browser cannot create passkeys.
                </p>
            )}

            {error && (
                <div
                    role="alert"
                    className="mt-4 rounded-md px-4 py-3 text-sm"
                    style={{
                        background: 'color-mix(in srgb, var(--down) 10%, transparent)',
                        color: 'var(--down)',
                    }}
                >
                    {error}
                </div>
            )}

            <p className="mt-8 text-xs text-[var(--muted)]">
                <Link
                    to="/"
                    className="font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                >
                    Back to homepage
                </Link>
            </p>
        </div>
    );
}
