/* Shared tooltip. One look for every app: copy tooltip.css + tooltip.js, then mark any element:
   <button data-tip="Edit" data-tip-sub="optional second line" data-tip-meta="optional mono line" data-tip-key="E">
   No framework, no dependencies. Works on hover and keyboard focus, flips below when there is no room above,
   keeps its arrow on the target, hides on scroll/route change. Reads the page's --text / --bg tokens (inverted card). */
(() => {
    const tip = document.createElement('div');
    tip.className = 'ui-tip';
    tip.setAttribute('role', 'tooltip');
    tip.id = 'ui-tip';
    document.body.appendChild(tip);
    let cur = null,
        timer = 0;
    const esc = (s) =>
        String(s).replace(
            /[&<>"]/g,
            (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c],
        );
    function render(t) {
        const d = t.dataset;
        return `<b>${esc(d.tip)}${d.tipKey ? `<kbd>${esc(d.tipKey)}</kbd>` : ''}</b>${d.tipSub ? `<span>${esc(d.tipSub)}</span>` : ''}${d.tipMeta ? `<em>${esc(d.tipMeta)}</em>` : ''}`;
    }
    function place() {
        if (!cur || !cur.isConnected) return hide();
        const r = cur.getBoundingClientRect(),
            w = tip.offsetWidth,
            h = tip.offsetHeight,
            vw = innerWidth,
            gap = 10;
        let x = r.left + r.width / 2 - w / 2;
        x = Math.max(8, Math.min(x, vw - w - 8));
        let y = r.top - h - gap,
            side = 'top';
        if (y < 8) {
            y = r.bottom + gap;
            side = 'bottom';
        }
        tip.style.setProperty('--x', Math.round(x) + 'px');
        tip.style.setProperty('--y', Math.round(y) + 'px');
        tip.style.setProperty('--ax', Math.round(r.left + r.width / 2 - x) + 'px');
        tip.dataset.side = side;
    }
    function show(t) {
        clearTimeout(timer);
        timer = setTimeout(
            () => {
                cur = t;
                tip.innerHTML = render(t);
                place();
                tip.classList.add('on');
            },
            cur ? 0 : 140,
        );
    }
    function hide() {
        clearTimeout(timer);
        tip.classList.remove('on');
        cur = null;
    }
    document.addEventListener('mouseover', (e) => {
        const t = e.target.closest('[data-tip]');
        if (t && t !== cur) show(t);
        else if (!t) hide();
    });
    document.addEventListener('focusin', (e) => {
        const t = e.target.closest('[data-tip]');
        if (t) show(t);
    });
    document.addEventListener('focusout', hide);
    document.addEventListener('click', hide, true);
    addEventListener('scroll', hide, { passive: true });
    addEventListener('resize', hide);
    addEventListener('hashchange', hide);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hide();
    });
})();
