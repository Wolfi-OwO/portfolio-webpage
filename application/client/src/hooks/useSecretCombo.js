import { useEffect, useRef, useState } from 'react';

const SEQUENCE = ['i', 'l', 'o', 'v', 'e', 'u'];

// Typing has to be deliberate: too fast reads as a key repeat or a paste, too
// slow means the letters just happened to land in that order while typing
// something else. Only the gaps *between* letters are timed - the first key
// starts the clock.
const MIN_GAP_MS = 250;
const MAX_GAP_MS = 1000;

const STORAGE_KEY = 'portfolio.secretFound';

/**
 * Watches for "I L O V E U" typed at a human pace and reports once it lands.
 *
 * Stays unlocked for the rest of the browser session (sessionStorage), so the
 * button doesn't vanish the moment you navigate away from the page you found
 * it on. Ignores keystrokes aimed at inputs so it can't fire while someone is
 * filling in the contact form.
 *
 * @returns {[boolean, () => void]} whether the combo has been found, and a reset
 */
export function useSecretCombo() {
    const [found, setFound] = useState(() => sessionStorage.getItem(STORAGE_KEY) === 'true');
    const progress = useRef(0);
    const lastKeyAt = useRef(0);

    useEffect(() => {
        if (found) return undefined;

        const handleKeydown = (event) => {
            const target = event.target;
            const typingElsewhere =
                target instanceof HTMLElement &&
                (target.isContentEditable ||
                    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

            if (typingElsewhere || event.ctrlKey || event.metaKey || event.altKey) return;

            const key = event.key.toLowerCase();
            const now = event.timeStamp;
            const gap = now - lastKeyAt.current;

            // A mistimed or wrong key drops the run - but the key still gets a
            // chance to be a fresh first letter, so "iiloveu" or a too-slow
            // start doesn't force you to stop and begin again from nothing.
            const inRhythm = progress.current === 0 || (gap >= MIN_GAP_MS && gap <= MAX_GAP_MS);

            if (inRhythm && key === SEQUENCE[progress.current]) {
                progress.current += 1;
            } else {
                progress.current = key === SEQUENCE[0] ? 1 : 0;
            }

            lastKeyAt.current = now;

            if (progress.current === SEQUENCE.length) {
                progress.current = 0;
                sessionStorage.setItem(STORAGE_KEY, 'true');
                setFound(true);
            }
        };

        window.addEventListener('keydown', handleKeydown);
        return () => window.removeEventListener('keydown', handleKeydown);
    }, [found]);

    const reset = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        progress.current = 0;
        setFound(false);
    };

    return [found, reset];
}
