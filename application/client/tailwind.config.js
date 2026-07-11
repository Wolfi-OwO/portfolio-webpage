/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    experimental: {},
    theme: {
        extend: {
            fontFamily: {
                sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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
                '2xs': ['clamp(0.625rem, 0.594rem + 0.14vw, 0.71875rem)', { lineHeight: '1.5' }],
                xs: ['clamp(0.75rem, 0.73rem + 0.09vw, 0.8125rem)', { lineHeight: '1.5' }],
                sm: ['clamp(0.8125rem, 0.77rem + 0.19vw, 0.9375rem)', { lineHeight: '1.55' }],
                base: ['clamp(0.9375rem, 0.895rem + 0.19vw, 1.0625rem)', { lineHeight: '1.6' }],
                lg: ['clamp(1.0625rem, 1rem + 0.28vw, 1.25rem)', { lineHeight: '1.55' }],
                xl: ['clamp(1.125rem, 1rem + 0.56vw, 1.5rem)', { lineHeight: '1.4' }],
                '2xl': ['clamp(1.25rem, 1.04rem + 0.93vw, 1.875rem)', { lineHeight: '1.3' }],
                '3xl': ['clamp(1.5rem, 1.25rem + 1.11vw, 2.25rem)', { lineHeight: '1.2' }],
                '4xl': ['clamp(1.75rem, 1.42rem + 1.48vw, 2.75rem)', { lineHeight: '1.15' }],
                '5xl': ['clamp(2rem, 1.5rem + 2.22vw, 3.5rem)', { lineHeight: '1.1' }],
                '6xl': ['clamp(2.25rem, 1.58rem + 2.96vw, 4.25rem)', { lineHeight: '1.05' }],
                '7xl': ['clamp(2.5rem, 1.67rem + 3.7vw, 5rem)', { lineHeight: '1.05' }],
            },
        },
    },
    safelist: [
        {
            pattern:
                /^(bg|text|border|ring)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)(\/\d+)?$/,
            variants: ['dark'],
        },
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
