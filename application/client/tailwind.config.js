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
