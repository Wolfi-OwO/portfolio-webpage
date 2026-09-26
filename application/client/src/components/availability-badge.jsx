import { FormattedMessage } from 'react-intl';

// Tailwind's scanner needs each `var(--x)` class written out as a full
// literal per tone — building the class name by interpolating the tone into
// the token at runtime never gets picked up by its static analysis (and,
// worse, the literal interpolation syntax embedded in a source-code comment
// is itself enough for the scanner to emit a broken, unminifiable class —
// hence this paragraph is phrased to avoid writing that literal out). Three
// tones, each tied to the matching CSS token.
const BADGE_TONE_CLASSES = {
    live: 'border-[var(--live)] bg-[color-mix(in_srgb,var(--live)_10%,transparent)] text-[var(--live)]',
    down: 'border-[var(--down)] bg-[color-mix(in_srgb,var(--down)_10%,transparent)] text-[var(--down)]',
    accent: 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)]',
};

const BADGE_DOT_CLASSES = {
    live: 'bg-[var(--live)]',
    down: 'bg-[var(--down)]',
    accent: 'bg-[var(--accent)]',
};

/**
 * Reads whatever `badgeState()` (utils/availability.js) currently says —
 * never a hard-coded claim. Shared by the homepage hero and the career
 * timeline strip so both surfaces show the exact same pill, not two copies
 * that could drift.
 */
export default function AvailabilityBadge({ badge }) {
    const tone = BADGE_TONE_CLASSES[badge.tone] ? badge.tone : 'accent';

    return (
        <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-2xs font-semibold uppercase tracking-[0.16em] ${BADGE_TONE_CLASSES[tone]}`}
        >
            <span className={`animate-live h-1.5 w-1.5 rounded-full ${BADGE_DOT_CLASSES[tone]}`} />
            <FormattedMessage id={badge.id} defaultMessage={badge.defaultMessage} />
        </span>
    );
}
