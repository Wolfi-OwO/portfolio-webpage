// Per-page text for the HTML the server sends. A crawler that does not run JavaScript, and the link
// preview a chat app builds, only ever see this: the app's own titles are set after it loads.
//
// These strings repeat the ones in client/src (usePageMeta calls and i18n/messages/de.js), because the
// server image carries only the built client, not its sources. Change a title in both places.

import { CASE_STUDIES, CASE_STUDY_ROUTES } from './case-studies.js';

const SITE_NAME = 'Woofi Developments';
const ORIGIN = 'https://www.woofi-developments.at';

// Routes that exist in both languages and may be indexed. /secret and /admin are deliberately not here.
const PUBLIC_ROUTES = [
    '/',
    '/projects',
    '/career',
    '/services',
    '/contact',
    '/privacy-policy',
    '/impressum',
    '/case-studies',
    ...CASE_STUDY_ROUTES,
];

const META = {
    '/': {
        en: {
            title: 'Fullstack Web Development',
            description:
                'Woofi Developments builds modern web applications with React, Node.js, and cloud technologies - fullstack software development based in Carinthia, Austria.',
        },
        de: {
            title: 'Webentwickler in Kärnten: Websites und Web-Apps',
            description:
                'Woofi Developments entwickelt Websites, Webanwendungen und Android-Apps mit React, Node.js und Cloud-Technologien. Freelance-Webentwicklung aus Villach, Kärnten.',
        },
    },
    '/projects': {
        en: {
            title: 'Projects',
            description: 'Software projects by Wolfi: web apps, tooling and infrastructure.',
        },
        de: {
            title: 'Projekte',
            description: 'Softwareprojekte von Wolfi: Web-Apps, Werkzeuge und Infrastruktur.',
        },
    },
    '/career': {
        en: {
            title: 'Career',
            description:
                'Work experience and education of Wolfi, a freelance full-stack developer from Villach, Austria.',
        },
        de: {
            title: 'Werdegang',
            description:
                'Berufserfahrung und Ausbildung von Wolfi, freiberuflicher Fullstack-Entwickler aus Villach, Österreich.',
        },
    },
    '/services': {
        en: {
            title: 'Services',
            description:
                'What Wolfi builds: websites, web applications, Android apps and desktop software, with plain prices.',
        },
        de: {
            title: 'Website erstellen lassen: Leistungen und Preise',
            description:
                'Websites, Webanwendungen, Android- und Desktop-Apps vom Freelancer in Villach. Mit klaren Preisen und ohne Baukasten-Ballast.',
        },
    },
    '/contact': {
        en: {
            title: 'Contact',
            description:
                'Get in touch about freelance projects, collaborations, and modern web engineering work.',
        },
        de: {
            title: 'Kontakt',
            description:
                'Kontakt für Freelance-Projekte, Zusammenarbeit und moderne Webentwicklung. Webentwickler aus Villach, Kärnten.',
        },
    },
    '/privacy-policy': {
        en: {
            title: 'Privacy Policy',
            description:
                'How this site handles data: no tracking, no analytics, no cookies — and exactly what does get processed.',
        },
        de: {
            title: 'Datenschutzerklärung',
            description:
                'Wie diese Seite mit Daten umgeht: kein Tracking, keine Analyse, keine Cookies, und genau das, was verarbeitet wird.',
        },
    },
    '/impressum': {
        en: {
            title: 'Impressum',
            description:
                'Information pursuant to §5 ECG and §25 MedienG for woofi-developments.at.',
        },
        de: {
            title: 'Impressum',
            description: 'Angaben gemäß § 5 ECG und § 25 MedienG für woofi-developments.at.',
        },
    },
};

META['/case-studies'] = {
    en: {
        title: 'Case Studies',
        description:
            'How Burrow, NetViz and Metrion were built: the problem, the decisions that mattered and where each stands.',
    },
    de: {
        title: 'Fallstudien',
        description:
            'Wie Burrow, NetViz und Metrion gebaut wurden: das Problem, die Entscheidungen, die zählten, und der Stand heute.',
    },
};
for (const study of CASE_STUDIES) {
    META[`/case-studies/${study.slug}`] = {
        en: { title: `${study.name} Case Study: ${study.en.kind}`, description: study.en.summary },
        de: { title: `${study.name} Fallstudie: ${study.de.kind}`, description: study.de.summary },
    };
}

// Visible headings and lead text, so the body holds what the page says and not just its title.
const COPY = {
    home: {
        en: {
            h1: 'I make software that does what it says.',
            role: 'Fullstack developer, Carinthia, Austria',
            bio: "I'm Phillip, a software developer from Carinthia. I build web applications, websites and apps, and I'm happiest where data and machine learning meet everyday software: tools that are fast and a pleasure to use. Alongside the code I climb, hike and keep tinkering with new ideas.",
            selected: 'Selected work',
            technologies: 'Technologies I use',
        },
        de: {
            h1: 'Ich baue Software, die tut, was sie verspricht.',
            role: 'Fullstack-Entwickler, Kärnten, Österreich',
            bio: 'Ich bin Phillip, Softwareentwickler aus Kärnten. Ich baue Webanwendungen, Websites und Apps und fühle mich dort am wohlsten, wo Daten und Machine Learning auf alltägliche Software treffen: Werkzeuge, die schnell sind, ehrlich zeigen, was sie tun, und Freude machen. Neben dem Code klettere und wandere ich und tüftle an neuen Ideen.',
            selected: 'Ausgewählte Arbeiten',
            technologies: 'Technologien, die ich nutze',
        },
    },
    services: {
        en: {
            h1: 'Services, priced plainly',
            lead: 'These prices are starting points. What a project costs depends on what it has to do, and I can only say that after we have talked.',
            hourly: 'Hourly rate',
            from: 'starting at',
            onRequest: 'On request',
            note: 'Write to me with a few lines about what the thing should do and I reply with what it would take.',
        },
        de: {
            h1: 'Leistungen mit klaren Preisen',
            lead: 'Diese Preise sind Richtwerte. Was ein Projekt kostet, hängt davon ab, was es können muss, und das kann ich erst nach einem Gespräch sagen.',
            hourly: 'Stundensatz',
            from: 'ab',
            onRequest: 'Auf Anfrage',
            note: 'Schreib mir ein paar Zeilen dazu, was das Ganze können soll, und ich antworte, was dafür nötig ist.',
        },
    },
    projects: {
        en: {
            h1: "Things I've shipped",
            lead: 'Projects, from teaching tools to infrastructure.',
        },
        de: {
            h1: 'Was ich gebaut habe',
            lead: 'Projekte, von Lehrwerkzeugen bis zur Infrastruktur.',
        },
    },
    career: {
        en: {
            h1: "Where I've been",
            lead: 'School, an HTL diploma in IT and summer placements at Infineon.',
            work: 'Work',
            education: 'Education',
        },
        de: {
            h1: 'Wo ich war',
            lead: 'Schule, ein HTL-Abschluss in IT und Ferialpraktika bei Infineon.',
            work: 'Berufserfahrung',
            education: 'Ausbildung',
        },
    },
    contact: {
        en: { h1: 'Get in touch' },
        de: { h1: 'Kontakt aufnehmen' },
    },
};

export { SITE_NAME, ORIGIN, PUBLIC_ROUTES, META, COPY };
