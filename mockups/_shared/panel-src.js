// Standalone colour picker for the static mockups: same palettes, contrast levels and fine-tune maths as the app (utils/appearance.js).
import { CTR, DEF, FACTORY, GROUPS, PALS, SLIDERS, applyCustom, currentAccentHex, injectPalettes, lsGet, lsSet } from '../../application/client/src/utils/appearance.js';

const root = document.documentElement;
let palette = PALS.some((p) => p.id === lsGet('pal')) ? lsGet('pal') : 'cobalt';
let contrast = CTR.some(([k]) => k === lsGet('ctr')) ? lsGet('ctr') : 'low';
let theme = ['dark', 'light'].includes(lsGet('thm')) ? lsGet('thm') : 'dark';
let tune; try { const r = lsGet('cust', ''); tune = r ? { ...DEF, ...JSON.parse(r) } : { ...FACTORY }; } catch { tune = { ...FACTORY }; }
let open = false, tab = 'palette';

const apply = () => {
  root.dataset.palette = palette; root.dataset.theme = theme; root.dataset.contrast = contrast; root.classList.toggle('dark', theme === 'dark');
  lsSet('pal', palette); lsSet('ctr', contrast); lsSet('thm', theme); lsSet('cust', JSON.stringify(tune)); applyCustom(tune);
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const body = () => tab === 'palette'
  ? GROUPS.map(([g, t]) => `<div class="pgrp"><b class="mono muted small">${t}</b><div class="pgrid">${PALS.filter((p) => p.g === g).map((p) => `<button class="pchip ${palette === p.id ? 'on' : ''}" data-pal="${p.id}" data-tip="${esc(p.n)}"><span class="pdot" style="--b:${p.c[0]};--a:${p.ad}"></span><em>${esc(p.n.replace('Classic ', ''))}</em></button>`).join('')}</div></div>`).join('')
    + `<p class="pnote"><b>${esc((PALS.find((p) => p.id === palette) || PALS[0]).n)}</b> ${esc((PALS.find((p) => p.id === palette) || PALS[0]).w)}</p>`
    + `<div class="pp-row"><span class="mono muted small">Mode</span><span class="seg">${['dark', 'light'].map((m) => `<button class="${theme === m ? 'on' : ''}" data-mode="${m}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</span></div>`
    + `<div class="pp-row"><span class="mono muted small">Contrast</span><span class="seg">${CTR.map(([k, l]) => `<button class="${contrast === k ? 'on' : ''}" data-ctr="${k}">${l}</button>`).join('')}</span></div>`
  : `<div class="pgrp"><b class="mono muted small">Exact accent colour</b><label class="hexrow"><input type="color" data-hex value="${tune.hex || currentAccentHex()}"><span class="mono small muted">${tune.hex || 'from palette'}</span><button class="btn sm ghost" data-hexoff>Use palette</button></label></div>`
    + SLIDERS.map(([t, rows]) => `<div class="pgrp"><b class="mono muted small">${t}</b>${rows.map(([k, l, mn, mx, u]) => `<label class="srow"><span>${l}</span><output>${tune[k]}${u}</output><input type="range" data-k="${k}" min="${mn}" max="${mx}" value="${tune[k]}" style="--p:${Math.round((tune[k] - mn) / (mx - mn) * 100)}%"></label>`).join('')}</div>`).join('')
    + `<label class="switch"><input type="checkbox" data-motion ${tune.motion ? 'checked' : ''}><i></i><span>Reduce motion</span></label>`;
const mount = document.createElement('div');
const draw = () => {
  const keep = mount.querySelector('.db')?.scrollTop || 0;
  mount.innerHTML = `<button class="palfab" id="palbtn"><span class="sw3 mini">${PALS.filter((p, i) => i % 4 === 0).slice(0, 8).map((p) => `<i style="background:${p.ad}"></i>`).join('')}</span>Colours</button>
  <aside class="drawer ${open ? 'open' : ''}" aria-label="Appearance"><div class="dh"><b>Appearance</b><button class="tool" data-close aria-label="Close">✕</button></div>
  <div class="dtabs">${[['palette', 'Palette'], ['fine', 'Fine-tune']].map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
  <div class="db">${body()}</div>
  <div class="df"><button class="btn sm ghost" data-reset>Reset</button><button class="btn sm ghost" data-neutral>Neutral</button><button class="btn sm ghost" data-copy="json">Copy settings</button><button class="btn sm" data-copy="css">Copy CSS</button></div></aside>`;
  const db = mount.querySelector('.db'); if (db) db.scrollTop = keep;
};
mount.addEventListener('click', (e) => {
  const q = (s) => e.target.closest(s);
  if (q('#palbtn')) open = !open; else if (q('[data-close]')) open = false;
  else if (q('[data-pal]')) { palette = q('[data-pal]').dataset.pal; tune = { ...tune, hex: '' }; }
  else if (q('[data-mode]')) theme = q('[data-mode]').dataset.mode;
  else if (q('[data-ctr]')) contrast = q('[data-ctr]').dataset.ctr;
  else if (q('[data-tab]')) tab = q('[data-tab]').dataset.tab;
  else if (q('[data-hexoff]')) tune = { ...tune, hex: '' };
  else if (q('[data-reset]')) { tune = { ...FACTORY }; palette = 'cobalt'; contrast = 'low'; }
  else if (q('[data-neutral]')) tune = { ...DEF };
  else if (q('[data-copy]')) { const css = q('[data-copy]').dataset.copy === 'css'; navigator.clipboard?.writeText(css ? ':root{\n' + [...root.style].filter((p) => p.startsWith('--')).map((p) => `  ${p}: ${root.style.getPropertyValue(p)};`).join('\n') + '\n}' : JSON.stringify({ palette, theme, contrast, ...tune }, null, 2)); return; }
  else return;
  apply(); draw();
});
mount.addEventListener('input', (e) => {
  const t = e.target;
  if (t.matches('[data-k]')) { tune = { ...tune, [t.dataset.k]: +t.value }; const o = t.parentElement.querySelector('output'); const row = SLIDERS.flatMap(([, r]) => r).find((r) => r[0] === t.dataset.k); o.textContent = t.value + row[4]; t.style.setProperty('--p', Math.round((t.value - row[2]) / (row[3] - row[2]) * 100) + '%'); }
  else if (t.matches('[data-hex]')) tune = { ...tune, hex: t.value };
  else if (t.matches('[data-motion]')) tune = { ...tune, motion: t.checked ? 1 : 0 };
  else return;
  apply();
});
mount.addEventListener('dblclick', (e) => { const t = e.target; if (t.matches('[data-k]')) { tune = { ...tune, [t.dataset.k]: DEF[t.dataset.k] }; apply(); draw(); } });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) { open = false; draw(); } });
injectPalettes(); apply(); draw(); document.body.appendChild(mount);
