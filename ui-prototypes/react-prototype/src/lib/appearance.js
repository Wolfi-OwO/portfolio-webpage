// Palettes, contrast steps and fine-tune maths. Same behaviour as the HTML mockup: palettes only declare raw --c-* colours,
// the stylesheet maps them to the tokens the UI uses, and the fine-tune controls rewrite the raw values on <html>.
export const lsGet = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
export const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

const lum = (hex) => { const n = parseInt(hex.slice(1), 16), f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); };
const ink = (hex, dark) => (lum(hex) > 0.3 ? (dark ? '#0b0b12' : '#111') : '#fff');

// id, name, group, hue, sat, accent dark, accent light, note, live colour override (dark), full token override
const RAW = [
  ['current', 'Current site', 'Current', 220, 40, '#6aa5ff', '#1f5fd0', 'The exact palette of woofi-developments.at today: navy ground, clear blue accent, green reserved for live status.', null,
    { d: { bg: '#070b18', s: '#0e1729', s2: '#17233c', t: '#e6ecf6', m: '#8ea0bd', l: '#22304c', a: '#6aa5ff', on: '#06101f', live: '#5fbf6a' }, l: { bg: '#eef2f9', s: '#ffffff', s2: '#e8eef7', t: '#0c1526', m: '#5a6a86', l: '#d2dcec', a: '#1f5fd0', on: '#ffffff', live: '#2f7d32' } }],
  ['sky', 'Sky Blue', 'Blues', 200, 50, '#7dd3fc', '#0369a1', 'Light and airy blue. Friendly, very readable on dark.'],
  ['azure', 'Azure', 'Blues', 212, 55, '#38a3ff', '#0b63c5', 'A touch brighter than your current blue. Same family, more punch.'],
  ['cobalt', 'Cobalt', 'Blues', 225, 60, '#5b7cff', '#1e40af', 'Deep, saturated blue with a richer navy ground.'],
  ['steel', 'Steel Blue', 'Blues', 210, 22, '#8fb4d9', '#3b5f86', 'Muted and professional. The calmest blue.'],
  ['electric', 'Electric Blue', 'Blues', 230, 65, '#4d6bff', '#2437d6', 'Vivid and modern. Strong on tiny elements.'],
  ['ice', 'Ice', 'Blues', 195, 35, '#bae6fd', '#0e7490', 'Pale ice blue. Subtle accent on dark.'],
  ['violet', 'Violet Night', 'Cool', 250, 45, '#8b7bff', '#5b46e5', 'Cool and creative. The only colour on the page, so it stands out on near-black blue.'],
  ['rose', 'Rose Plum', 'Cool', 285, 30, '#ff5c93', '#d6336c', 'Soft and friendly. Works well next to art and a sona section.'],
  ['cyan', 'Cyan Signal', 'Cool', 205, 55, '#4cc9f0', '#0a7ea4', 'Closest to the current blue site. Crisp and technical.'],
  ['mint', 'Mint Teal', 'Cool', 168, 50, '#3ee0b0', '#0b8f6a', 'Calm and fresh. The live dot turns amber so it never blends in.', '#ffd166'],
  ['lime', 'Lime Ink', 'Cool', 85, 35, '#c6f135', '#4d7c0f', 'Highest energy. Terminal heritage without green-on-black cliché.'],
  ['fuchsia', 'Fuchsia Neon', 'Cool', 295, 45, '#e879f9', '#a21caf', 'Loud and playful. Good for a creative, personality-first site.'],
  ['indigo', 'Indigo Dusk', 'Cool', 236, 48, '#818cf8', '#4338ca', 'Bluer than violet, a late-evening feel. Quiet and focused.'],
  ['crimson', 'Crimson Noir', 'Cool', 350, 38, '#ff4d5e', '#c81e3a', 'Dramatic red on warm black. Editorial and confident.'],
  ['solar', 'Solar Yellow', 'Cool', 48, 28, '#facc15', '#a16207', 'Pure yellow, no orange. Reads like a highlighter on dark.'],
  ['lavender', 'Lavender Mist', 'Cool', 265, 26, '#c4b5fd', '#6d28d9', 'Pastel and gentle. Lower energy, high polish.'],
  ['blue', 'Classic Blue', 'Classic', 220, 24, '#3b82f6', '#2563eb', 'The default, trustworthy blue. Safe for any audience.'],
  ['green', 'Classic Green', 'Classic', 150, 18, '#22c55e', '#15803d', 'Standard green. Pairs with an amber status dot.', '#ffd166'],
  ['red', 'Classic Red', 'Classic', 0, 14, '#ef4444', '#dc2626', 'Standard red. Strong, urgent, use sparingly.'],
  ['purple', 'Classic Purple', 'Classic', 275, 20, '#a855f7', '#7e22ce', 'Standard purple. Creative but conventional.'],
  ['teal', 'Classic Teal', 'Classic', 175, 20, '#14b8a6', '#0f766e', 'Standard teal. Calm, professional, easy to read.'],
  ['aqua', 'Aqua', 'More', 188, 55, '#22e0e0', '#0e8a8a', 'Bright aqua. Fresh and techy.'],
  ['jade', 'Jade', 'More', 160, 45, '#34d399', '#047857', 'Jewel green with a blue-green ground.'],
  ['magenta', 'Magenta', 'More', 320, 45, '#f43f9d', '#be185d', 'Hot magenta. Loud, confident.'],
  ['orchid', 'Orchid', 'More', 305, 35, '#d084e6', '#86198f', 'Soft orchid purple-pink.'],
  ['wine', 'Wine', 'More', 335, 40, '#e0527a', '#9f1239', 'Deep wine red. Elegant on dark.'],
  ['gold', 'Gold Leaf', 'More', 42, 30, '#e6c35c', '#8a6a00', 'Muted gold. Premium, editorial.'],
  ['sage', 'Sage', 'More', 120, 14, '#a3c9a8', '#3f6b47', 'Soft sage green on a quiet ground.'],
  ['mauve', 'Mauve', 'More', 290, 18, '#c4a1d9', '#6b3f82', 'Dusty mauve. Gentle and unusual.'],
];
const OVR = { violet: { d: ['#0c0b1f', '#15132e', '#1f1c42'], l: ['#f6f5ff', '#ffffff', '#ecebff'] }, rose: { d: ['#1a1320', '#251a2e', '#34253f'], l: ['#fff5f8', '#ffffff', '#ffe8ef'] } };

export const PALS = RAW.map(([id, n, g, h, sat, ad, al, w, liveD, full]) => ({ id, n, g, h, sat, ad, al, w, liveD, full, c: [full?.d.bg || OVR[id]?.d[0] || `hsl(${h} ${sat}% 7%)`, ad] }));
export const GROUPS = [['Current', 'Your current site'], ['Blues', 'Blues'], ['Cool', 'Cool'], ['Classic', 'Classic'], ['More', 'More colours']];
export const CTR = [['soft', 'Soft'], ['low', 'Low'], ['medium', 'Medium'], ['medhigh', 'Med-high'], ['high', 'High']];

export function injectPalettes() {
  if (document.getElementById('pal-css')) return;
  const css = PALS.map((p) => {
    if (p.full) {
      const f = (m) => `--c-bg:${m.bg};--c-surface:${m.s};--c-surface-2:${m.s2};--c-text:${m.t};--c-muted:${m.m};--c-line:${m.l};--c-accent:${m.a};--c-on:${m.on};--c-live:${m.live}`;
      return `html:root[data-palette=${p.id}][data-theme=dark]{${f(p.full.d)}}\nhtml:root[data-palette=${p.id}][data-theme=light]{${f(p.full.l)}}`;
    }
    const o = OVR[p.id];
    const dk = o ? o.d : [`hsl(${p.h} ${p.sat}% 7%)`, `hsl(${p.h} ${Math.round(p.sat * 0.9)}% 11%)`, `hsl(${p.h} ${Math.round(p.sat * 0.8)}% 16%)`];
    const lt = o ? o.l : [`hsl(${p.h} 70% 97%)`, '#ffffff', `hsl(${p.h} 55% 93%)`];
    return `html:root[data-palette=${p.id}][data-theme=dark]{--c-bg:${dk[0]};--c-surface:${dk[1]};--c-surface-2:${dk[2]};--c-text:hsl(${p.h} 40% 96%);--c-muted:hsl(${p.h} 20% 70%);--c-line:hsl(${p.h} 40% 96%/.14);--c-accent:${p.ad};--c-on:${ink(p.ad, true)};--c-live:${p.liveD || '#4cd48a'}}\n`
      + `html:root[data-palette=${p.id}][data-theme=light]{--c-bg:${lt[0]};--c-surface:${lt[1]};--c-surface-2:${lt[2]};--c-text:hsl(${p.h} 45% 11%);--c-muted:hsl(${p.h} 14% 38%);--c-line:hsl(${p.h} 45% 11%/.14);--c-accent:${p.al};--c-on:${ink(p.al, false)};--c-live:#1f8a4c}`;
  }).join('\n');
  const st = document.createElement('style'); st.id = 'pal-css'; st.textContent = css; document.head.appendChild(st);
}

// The look the owner saved from the mockup: Cobalt, dark, low contrast, rounded.
export const FACTORY = { hue: 1, sat: 100, lit: -7, hex: '', tb: 30, tint: 0, mb: 30, depth: -7, lift: 0, line: 60, radius: 36, glow: 43, fs: 94, motion: 0 };
export const DEF = { hue: 0, sat: 100, lit: 0, hex: '', tb: 0, tint: 0, mb: 0, depth: 0, lift: 0, line: 14, radius: 22, glow: 0, fs: 100, motion: 0 };
export const SLIDERS = [
  ['Accent', [['hue', 'Hue shift', -180, 180, '°'], ['sat', 'Saturation', 0, 200, '%'], ['lit', 'Lightness', -30, 30, '']]],
  ['Text', [['tb', 'Brightness', -40, 40, ''], ['tint', 'Colour tint (flashy text)', 0, 100, '%'], ['mb', 'Secondary text brightness', -30, 30, '']]],
  ['Surfaces', [['depth', 'Background depth', -20, 20, ''], ['lift', 'Surface separation', 0, 30, ''], ['line', 'Line strength', 0, 60, '%']]],
  ['Shape & feel', [['radius', 'Corner radius', 0, 36, 'px'], ['glow', 'Accent glow', 0, 100, '%'], ['fs', 'Text size', 85, 125, '%']]],
];

let cvs;
const toRGB = (str) => { cvs ||= document.createElement('canvas').getContext('2d'); cvs.fillStyle = '#000'; cvs.fillStyle = String(str).trim(); const v = cvs.fillStyle; if (v[0] === '#') { const n = parseInt(v.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; } return v.match(/[\d.]+/g).map(Number).slice(0, 3); };
export const toHex = (c) => '#' + c.map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
const mixc = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);
const rgb2hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0, s = 0; const l = (mx + mn) / 2; if (d) { s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; };
const hsl2rgb = ([h, s, l]) => { const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return [(r + m) * 255, (g + m) * 255, (b + m) * 255]; };
const lumc = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const OVERRIDES = ['--c-bg', '--c-surface', '--c-surface-2', '--c-text', '--c-muted', '--c-line', '--c-accent', '--c-on', '--r', '--r-s', '--glow'];

export function applyCustom(S) {
  const root = document.documentElement, st = root.style;
  OVERRIDES.forEach((v) => st.removeProperty(v)); st.fontSize = ''; root.dataset.motion = S.motion ? 'off' : 'on';
  const cs = getComputedStyle(root), g = (v) => toRGB(cs.getPropertyValue(v));
  if (!cs.getPropertyValue('--c-bg').trim()) return;
  let bg = g('--c-bg'), sf = g('--c-surface'), s2 = g('--c-surface-2'), tx = g('--c-text'), mu = g('--c-muted'), ac = g('--c-accent');
  const W = [255, 255, 255], K = [0, 0, 0], set = (k, c) => st.setProperty(k, typeof c === 'string' ? c : toHex(c));
  if (S.hex) ac = toRGB(S.hex);
  if (S.hue || S.sat !== 100 || S.lit) { const [h, s, l] = rgb2hsl(ac); ac = hsl2rgb([(h + S.hue + 360) % 360, Math.max(0, Math.min(1, s * S.sat / 100)), Math.max(0.08, Math.min(0.95, l + S.lit / 100))]); }
  if (S.hex || S.hue || S.sat !== 100 || S.lit) { set('--c-accent', ac); set('--c-on', lumc(ac) > 0.3 ? '#0b0b12' : '#ffffff'); }
  if (S.depth) { const t = Math.abs(S.depth) / 100, to = S.depth < 0 ? K : W; bg = mixc(bg, to, t); sf = mixc(sf, to, t); s2 = mixc(s2, to, t); set('--c-bg', bg); }
  if (S.lift) { sf = mixc(sf, tx, S.lift / 200); s2 = mixc(s2, tx, S.lift / 140); }
  if (S.depth || S.lift) { set('--c-surface', sf); set('--c-surface-2', s2); }
  let nt = tx; if (S.tb) nt = S.tb > 0 ? mixc(tx, W, S.tb / 100) : mixc(tx, bg, -S.tb / 100); if (S.tint) nt = mixc(nt, ac, S.tint / 100 * 0.55);
  if (S.tb || S.tint) set('--c-text', nt);
  let nm = mu; if (S.mb) nm = S.mb > 0 ? mixc(mu, W, S.mb / 100) : mixc(mu, bg, -S.mb / 100); if (S.tint) nm = mixc(nm, ac, S.tint / 100 * 0.3);
  if (S.mb || S.tint) set('--c-muted', nm);
  if (S.line !== 14) { const c = S.tb || S.tint ? nt : tx; set('--c-line', `rgba(${c.map(Math.round).join(',')},${S.line / 100})`); }
  if (S.radius !== 22) { st.setProperty('--r', S.radius + 'px'); st.setProperty('--r-s', Math.round(S.radius * 0.65) + 'px'); }
  if (S.glow) st.setProperty('--glow', S.glow + '%');
  if (S.fs !== 100) st.fontSize = (16 * S.fs / 100) + 'px';
}

export function currentAccentHex() { try { return toHex(toRGB(getComputedStyle(document.documentElement).getPropertyValue('--c-accent') || '#6aa5ff')); } catch { return '#6aa5ff'; } }
