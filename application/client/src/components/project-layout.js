// Kept apart from design-bits.jsx: a module that exports components must export
// nothing else, or Vite's fast refresh falls back to a full reload.
export const SHOTS = {
    NetViz: '/shots/netviz.png',
    Burrow: '/shots/burrow.png',
    Metrion: '/shots/metrion.png',
    Nutrilens: '/shots/nutrilens.png',
    'Machine Learning Visualizer': '/shots/ml.png',
    // No live demo to photograph for these: a drawn cover keeps the wall even without pretending to be a screenshot.
    Alpinfex: '/shots/alpinfex.svg',
    'Image Upscaler': '/shots/image-upscaler.svg',
    LearnSphere: '/shots/learnsphere.svg',
    'Home Statistics Board': '/shots/home-statistics-board.svg',
};

export const hasShot = (p) => Boolean(SHOTS[p.title]);

// Rows always add up to 12 columns, so each row ends flush on the right while the
// cards inside it differ in width, the way a justified photo wall does. Two per row
// alternate 7+5 / 5+7, three share the row evenly, and a leftover single card is
// folded into the previous row rather than left stranded at full width.
export function rowSpans(count) {
    const spans = [];
    let left = count;
    let flip = false;
    while (left > 0) {
        if (left === 3 || left === 1) {
            const n = left === 1 ? 1 : 3;
            spans.push(...Array(n).fill(12 / n));
            left -= n;
        } else {
            spans.push(...(flip ? [5, 7] : [7, 5]));
            flip = !flip;
            left -= 2;
        }
    }
    return spans;
}
