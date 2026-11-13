import { useEffect } from 'react';
import { FACTORY, applyCustom, injectPalettes } from '../utils/appearance.js';
import '../appearance.css';
import '../tooltip.css';
import '../utils/tooltip.js';

// The site has one look: Cobalt, low contrast, rounded. The palette picker lives in the mockups and prototypes only;
// the app just applies the saved values and follows the light/dark class the layout already toggles.
export default function useSavedLook() {
    useEffect(() => {
        injectPalettes();
        const root = document.documentElement;
        const TOKENS = [
            '--bg',
            '--surface',
            '--surface-2',
            '--text',
            '--muted',
            '--line',
            '--accent',
            '--on-accent',
            '--live',
            '--glass',
        ];
        const sync = () => {
            // Drop the colours the head script painted from the cache; they are recomputed below.
            TOKENS.forEach((t) => root.style.removeProperty(t));
            root.dataset.palette = 'cobalt';
            root.dataset.contrast = 'medium';
            root.dataset.theme = root.classList.contains('dark') ? 'dark' : 'light';
            applyCustom(FACTORY);
            try {
                const cs = getComputedStyle(root);
                const mode = root.dataset.theme;
                const all = JSON.parse(localStorage.getItem('look.tokens') || '{}');
                all[mode] = Object.fromEntries(
                    TOKENS.map((t) => [t, cs.getPropertyValue(t).trim()]),
                );
                localStorage.setItem('look.tokens', JSON.stringify(all));
            } catch {
                // storage blocked: the page just paints a frame later
            }
        };
        // First visit: the palette is applied after mount, which changes every colour variable
        // at once. Without this guard each of the ~900 elements with a colour transition animated
        // that change on the main thread (2.2 s of blocking time on a cold mobile load).
        root.classList.add('look-applying');
        sync();
        requestAnimationFrame(() =>
            requestAnimationFrame(() => root.classList.remove('look-applying')),
        );
        const mo = new MutationObserver(sync);
        mo.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => mo.disconnect();
    }, []);
}
