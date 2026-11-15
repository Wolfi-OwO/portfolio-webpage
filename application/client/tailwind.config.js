/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    experimental: {},
    theme: {
        extend: {
            fontFamily: {
                sans: ['Schibsted Grotesk', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
            },

            /* Fluid type — one continuous scale, no breakpoints anywhere.
               Every step interpolates between its value at a 360px viewport and
               its value at 1440px, so a size grows smoothly with the window from
               phone to desktop. Each step therefore spans the whole range a
               `text-3xl sm:text-5xl` pair used to cover, which is why no element
               needs a responsive text variant any more — and why nothing jumps.
               Line heights are unitless so they follow the size. */
            fontSize: {
                /* Floors raised after measuring the scale: 2xs was 10px on every phone
                   (53 uses) and base was 15px at 320-375. The contract wants nothing
                   under 12px and body 16-18px, so 2xs now equals xs, sm starts at
                   14px and base runs 16px (375) to 18px (1440). */
                '2xs': ['clamp(0.75rem, 0.73rem + 0.09vw, 0.8125rem)', { lineHeight: '1.5' }],
                xs: ['clamp(0.75rem, 0.73rem + 0.09vw, 0.8125rem)', { lineHeight: '1.5' }],
                sm: ['clamp(0.875rem, 0.85rem + 0.1vw, 0.9375rem)', { lineHeight: '1.55' }],
                base: ['clamp(1rem, 0.95rem + 0.2vw, 1.125rem)', { lineHeight: '1.6' }],
                lg: ['clamp(1.0625rem, 1rem + 0.28vw, 1.25rem)', { lineHeight: '1.55' }],
                xl: ['clamp(1.125rem, 1rem + 0.56vw, 1.5rem)', { lineHeight: '1.4' }],
                '2xl': ['clamp(1.25rem, 1.04rem + 0.93vw, 1.875rem)', { lineHeight: '1.3' }],
                '3xl': ['clamp(1.5rem, 1.25rem + 1.11vw, 2.25rem)', { lineHeight: '1.2' }],
                '4xl': ['clamp(1.75rem, 1.42rem + 1.48vw, 2.75rem)', { lineHeight: '1.15' }],
                '5xl': ['clamp(2rem, 1.5rem + 2.22vw, 3.5rem)', { lineHeight: '1.1' }],
                '6xl': ['clamp(2.25rem, 1.58rem + 2.96vw, 4.25rem)', { lineHeight: '1.05' }],
                '7xl': ['clamp(2.5rem, 1.67rem + 3.7vw, 5rem)', { lineHeight: '1.05' }],
                /* Home h1 only: 36px at 320, 60px at 1440 (hero range 48-64 on desktop,
                   32-40 on phones in the references measured). */
                display: ['clamp(2.25rem, 1.7rem + 2.6vw, 3.75rem)', { lineHeight: '1.05' }],
            },
        },
    },
    // The admin colour picker only ever writes `bg-<colour>-<shade>` with `text-<colour>-50|950`
    // (see classesForColor in utils/tailwind-palette.js), and the technology chips already in the
    // database use the few exact classes below. A pattern over every colour, shade, opacity and
    // dark variant used to generate about 42,000 rules (2.3 MB of CSS) for this.
    safelist: [
        {
            pattern:
                /^bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)$/,
        },
        {
            pattern:
                /^text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|950)$/,
        },
        // classes stored with the technologies today
        'bg-blue-100',
        'bg-cyan-100',
        'bg-emerald-100',
        'bg-green-100',
        'bg-indigo-100',
        'bg-neutral-200',
        'bg-purple-100',
        'bg-sky-100',
        'bg-slate-100',
        'bg-violet-100',
        'dark:bg-blue-500/20',
        'dark:bg-cyan-500/20',
        'dark:bg-emerald-500/20',
        'dark:bg-green-500/20',
        'dark:bg-indigo-500/20',
        'dark:bg-neutral-700/30',
        'dark:bg-purple-500/20',
        'dark:bg-sky-500/20',
        'dark:bg-slate-500/20',
        'dark:bg-violet-500/20',
        'dark:text-blue-300',
        'dark:text-cyan-300',
        'dark:text-emerald-300',
        'dark:text-green-300',
        'dark:text-indigo-300',
        'dark:text-neutral-200',
        'dark:text-purple-300',
        'dark:text-sky-300',
        'dark:text-slate-300',
        'dark:text-violet-300',
        'text-blue-800',
        'text-cyan-800',
        'text-emerald-800',
        'text-green-800',
        'text-indigo-700',
        'text-indigo-800',
        'text-neutral-800',
        'text-purple-800',
        'text-sky-800',
        'text-slate-800',
        'text-violet-800',
    ],
    plugins: [],
};

/*
Farbideen für Technologien / Programmiersprachen:

emerald -> Python
indigo  -> Streamlit / Next.js
sky     -> React
green   -> Node.js
neutral -> Express
cyan    -> TailwindCSS

yellow  -> JavaScript
blue    -> TypeScript / Docker
red     -> Java / Angular
orange  -> HTML / Git
purple  -> C# / GraphQL
pink    -> SASS / Prisma
slate   -> SQL / Backend Tools
*/
