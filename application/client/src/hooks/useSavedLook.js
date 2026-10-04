import { useEffect } from 'react';
import { FACTORY, applyCustom, injectPalettes } from '../utils/appearance.js';
import '../appearance.css';
import '../tooltip.css';
import '../utils/tooltip.js';

// The site has one look: Cobalt, low contrast, rounded. The palette picker lives in the mockups and ui-prototypes only;
// the app just applies the saved values and follows the light/dark class the layout already toggles.
export default function useSavedLook() {
    useEffect(() => {
        injectPalettes();
        const root = document.documentElement;
        const sync = () => {
            root.dataset.palette = 'cobalt';
            root.dataset.contrast = 'low';
            root.dataset.theme = root.classList.contains('dark') ? 'dark' : 'light';
            applyCustom(FACTORY);
        };
        sync();
        const mo = new MutationObserver(sync);
        mo.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => mo.disconnect();
    }, []);
}
