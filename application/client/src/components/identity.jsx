import { useEffect, useState } from 'react';
import { SOCIALS } from '../utils/identity.js';

/**
 * Social links. Real links navigate; Discord copies its handle, because a
 * Discord username isn't a URL and a link that 404s is worse than a button.
 */
export function SocialRow() {
    const [copied, setCopied] = useState(null);

    useEffect(() => {
        if (!copied) return undefined;
        const id = setTimeout(() => setCopied(null), 1600);
        return () => clearTimeout(id);
    }, [copied]);

    const cls =
        'inline-flex items-center gap-2 rounded-md border border-[var(--line)] px-3 py-1.5 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]';

    return (
        <ul className="flex flex-wrap gap-2">
            {SOCIALS.map(social => (
                <li key={social.key}>
                    {social.href ? (
                        <a
                            href={social.href}
                            target={social.href.startsWith('mailto:') ? undefined : '_blank'}
                            rel={social.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                            className={cls}
                        >
                            <social.Icon className="h-4 w-4 shrink-0" />
                            {social.label}
                        </a>
                    ) : (
                        <button
                            type="button"
                            onClick={() =>
                                navigator.clipboard.writeText(social.copy).then(
                                    () => setCopied(social.key),
                                    () => setCopied(null),
                                )
                            }
                            aria-label={`Copy Discord handle ${social.value}`}
                            className={`${cls} cursor-pointer`}
                        >
                            <social.Icon className="h-4 w-4 shrink-0" />
                            {copied === social.key ? 'Copied' : social.label}
                        </button>
                    )}
                </li>
            ))}
        </ul>
    );
}
