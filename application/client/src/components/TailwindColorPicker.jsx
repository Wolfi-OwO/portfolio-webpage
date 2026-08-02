import { useEffect, useMemo, useState } from 'react';
import { Squares2X2Icon, XMarkIcon } from '@heroicons/react/24/outline';
import {
    COLORS,
    PALETTES,
    classesForColor,
    hexToTailwindClasses,
    nearestColor,
} from '../utils/tailwind-palette.js';

function parseColorInput(value) {
    if (!value) return null;
    const trimmed = value.trim();

    if (/^#?[0-9a-fA-F]{6}$/.test(trimmed)) {
        return (trimmed.startsWith('#') ? trimmed : `#${trimmed}`).toLowerCase();
    }

    if (/^#?[0-9a-fA-F]{3}$/.test(trimmed)) {
        const h = trimmed.replace('#', '');
        return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
    }

    const rgb = trimmed.match(/(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/);
    if (rgb) {
        const toHex = (n) =>
            Math.max(0, Math.min(255, Number(n)))
                .toString(16)
                .padStart(2, '0');
        return `#${toHex(rgb[1])}${toHex(rgb[2])}${toHex(rgb[3])}`;
    }

    return null;
}

function matchFromClasses(classString) {
    if (!classString) return null;
    const match = classString.match(/bg-([a-z]+)-(50|100|200|300|400|500|600|700|800|900|950)\b/);
    if (!match) return null;
    const [, palette, shade] = match;
    if (!COLORS[palette]?.[shade]) return null;
    return { palette, shade, hex: COLORS[palette][shade] };
}

export default function TailwindColorPicker({ value, onChange }) {
    const initial = matchFromClasses(value) || nearestColor('#0ea5e9');
    const [hex, setHex] = useState(initial.hex);
    const [textInput, setTextInput] = useState(initial.hex);
    const [error, setError] = useState('');
    const [quickOpen, setQuickOpen] = useState(false);

    useEffect(() => {
        if (!quickOpen) return;

        const handleEscape = (event) => {
            if (event.key === 'Escape') setQuickOpen(false);
        };

        document.addEventListener('keydown', handleEscape);
        const previousOverflow = document.body.style.overflow;
        const previousPaddingRight = document.body.style.paddingRight;

        // Calculate scrollbar width to prevent layout shift
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = previousOverflow;
            document.body.style.paddingRight = previousPaddingRight;
        };
    }, [quickOpen]);

    const resolved = useMemo(() => hexToTailwindClasses(hex), [hex]);

    function applyHex(input) {
        const parsed = parseColorInput(input);
        if (!parsed) {
            setError('Enter a hex value (#RRGGBB) or RGB triplet (r, g, b)');
            return;
        }
        setError('');
        setHex(parsed);
        setTextInput(parsed);
        onChange(hexToTailwindClasses(parsed).classes);
    }

    function selectAnchor(palette, shade) {
        const anchorHex = COLORS[palette][shade];
        setHex(anchorHex);
        setTextInput(anchorHex);
        setError('');
        onChange(classesForColor({ palette, shade, hex: anchorHex }));
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <input
                    type="color"
                    value={hex}
                    onChange={(e) => applyHex(e.target.value)}
                    className="h-10 w-14 cursor-pointer overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-0 [&::-moz-color-swatch]:rounded-lg [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-lg [&::-webkit-color-swatch]:border-none"
                    aria-label="Pick a color"
                />

                <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onBlur={(e) => applyHex(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            applyHex(textInput);
                        }
                    }}
                    placeholder="#1e90ff or 30, 144, 255"
                    className="min-w-[12rem] flex-1 rounded-2xl border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder-[var(--muted)] transition focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />

                <button
                    type="button"
                    onClick={() => setQuickOpen(true)}
                    aria-haspopup="dialog"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text)] shadow-sm transition hover:border-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                >
                    <Squares2X2Icon className="h-4 w-4" />
                    Quick Picks
                </button>
            </div>

            {error && <p className="text-xs text-[var(--down)]">{error}</p>}

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-3">
                <span
                    className="inline-flex h-7 w-7 rounded-full border border-[var(--surface)] shadow-sm"
                    style={{ backgroundColor: hex }}
                    aria-hidden="true"
                />

                <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Mapped to
                </span>

                <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ring-black/10 dark:ring-white/10 ${resolved.classes}`}
                >
                    {resolved.palette}-{resolved.shade}
                </span>

                <span className="text-2xs text-[var(--muted)]">{resolved.paletteHex}</span>

                <code className="ml-auto truncate text-2xs text-[var(--muted)]">
                    {resolved.classes}
                </code>
            </div>

            {quickOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Quick color picks"
                    className="fixed inset-0 z-50 !mt-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--text)_65%,transparent)] p-4 backdrop-blur-md"
                >
                    <button
                        type="button"
                        aria-label="Close color picker"
                        onClick={() => setQuickOpen(false)}
                        className="absolute inset-0 cursor-pointer"
                    />

                    <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface)] [box-shadow:var(--shadow-float)]">
                        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-4">
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                                    Quick Picks
                                </p>
                                <h3 className="mt-1 text-lg font-semibold text-[var(--text)]">
                                    Choose a Tailwind color
                                </h3>
                            </div>

                            <button
                                type="button"
                                onClick={() => setQuickOpen(false)}
                                aria-label="Close"
                                className="cursor-pointer rounded-full p-2 text-[var(--muted)] transition hover:bg-[var(--bg)] hover:text-[var(--text)]"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="overflow-auto px-6 py-5">
                            <div className="space-y-2">
                                {PALETTES.map((palette) => (
                                    <div key={palette.name} className="flex items-center gap-3">
                                        <span className="w-20 shrink-0 truncate text-xs font-medium text-[var(--muted)]">
                                            {palette.name}
                                        </span>
                                        <div className="flex flex-1 flex-wrap gap-1.5">
                                            {[
                                                '50',
                                                '100',
                                                '200',
                                                '300',
                                                '400',
                                                '500',
                                                '600',
                                                '700',
                                                '800',
                                                '900',
                                                '950',
                                            ].map((shade) => {
                                                const shadeHex = COLORS[palette.name][shade];
                                                const active =
                                                    resolved.palette === palette.name &&
                                                    resolved.shade === shade;
                                                return (
                                                    <button
                                                        key={shade}
                                                        type="button"
                                                        onClick={() => {
                                                            selectAnchor(palette.name, shade);
                                                            setQuickOpen(false);
                                                        }}
                                                        aria-label={`${palette.name}-${shade}`}
                                                        title={`${palette.name}-${shade} · ${shadeHex}`}
                                                        style={{
                                                            backgroundColor: shadeHex,
                                                        }}
                                                        className={`h-8 w-8 cursor-pointer rounded-lg border transition ${
                                                            active
                                                                ? 'border-[var(--text)] ring-2 ring-[var(--accent)]'
                                                                : 'border-transparent hover:scale-110 hover:border-[var(--muted)]'
                                                        }`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
