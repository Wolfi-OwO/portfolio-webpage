// Translations of content that lives in the database. A record's own fields hold the language it was
// written in (services and career entries in German, projects in English); `translations.<locale>`
// holds the other one, so each language version of the site reads in one language.
//
// Each entry names the record by the fields that identify it, and is applied only to a record that has no
// `translations` yet (see utils/backfill-translations.js), so a translation edited later is never overwritten.

const SERVICES = [
    {
        match: { title: 'Website' },
        locale: 'en',
        fields: {
            title: 'Website',
            description:
                'A fast, modern website: landing page, portfolio or company site. Responsive, accessible and without page-builder bloat.',
            deliverables: [
                'Design and build with React and Tailwind',
                'Responsive from phone to desktop',
                'Ways to get in touch, and the legal pages',
                'Deployment including connecting your domain',
            ],
            duration: '1–3 weeks',
        },
    },
    {
        match: { title: 'Webanwendung' },
        locale: 'en',
        fields: {
            title: 'Web application',
            description:
                'A real application in the browser: login, database, its own API. Everything that goes beyond a website.',
            deliverables: [
                'Frontend with React',
                'REST API with Node.js and Express',
                'Database (MongoDB or PostgreSQL)',
                'User accounts and authentication',
                'Operation in containers on Azure',
            ],
            duration: '3–8 weeks',
        },
    },
    {
        match: { title: 'Android-App' },
        locale: 'en',
        fields: {
            title: 'Android app',
            description:
                'A native Android app in Kotlin, from a simple utility to an app with its own backend.',
            deliverables: [
                'Native build in Kotlin',
                'Material Design interface',
                'Connection to an existing or new API',
                'Signed release build for the Play Store',
            ],
            duration: '3–6 weeks',
        },
    },
    {
        match: { title: 'Desktop-Anwendung' },
        locale: 'en',
        fields: {
            title: 'Desktop application',
            description:
                'A desktop GUI with JavaFX or .NET for tools that have to run locally instead of in the browser.',
            deliverables: [
                'Interface with JavaFX or .NET (WPF)',
                'Local data storage or a connection to a server',
                'Installer or executable package',
            ],
            duration: '2–5 weeks',
        },
    },
    {
        match: { title: 'Kleinere Arbeiten und Wartung' },
        locale: 'en',
        fields: {
            title: 'Smaller jobs and maintenance',
            description:
                'Debugging, extensions to existing code, setting up a deployment, repairing a CI pipeline. Billed by the hour.',
            deliverables: [
                'Bug fixes and smaller features',
                'Docker and CI/CD setup',
                'Code review and refactoring',
            ],
            duration: 'by arrangement',
        },
    },
];

const PROJECTS = [
    {
        match: { title: 'NetViz' },
        locale: 'de',
        fields: {
            description:
                'Reale Unternehmensnetzwerke im Browser entwerfen, visualisieren und simulieren. Mit Drag-and-drop-Topologie-Editor, Paketsimulation Hop für Hop, einer Mitschnitt-Ansicht im Stil von Wireshark und einem CIDR-Rechner.',
        },
    },
    {
        match: { title: 'Machine Learning Visualizer' },
        locale: 'de',
        fields: {
            description:
                'Eine Lernseite, die Schüler:innen hilft, grundlegende Algorithmen des maschinellen Lernens zu verstehen.',
        },
    },
    {
        match: { title: 'Alpinfex' },
        locale: 'de',
        fields: {
            description:
                'Eine Blog-Website für begeisterte Bergsteiger:innen, die ihre Erlebnisse mit anderen teilen möchten.',
        },
    },
    {
        match: { title: 'Image Upscaler' },
        locale: 'de',
        fields: {
            description:
                'Ein kostenloses, KI-gestütztes Kommandozeilenwerkzeug, das Bilder mit Real-ESRGAN bis auf das 16-Fache vergrößert, mit GPU-Beschleunigung und einem sauberen Lanczos-Fallback, wenn der KI-Stack nicht verfügbar ist.',
        },
    },
    {
        match: { title: 'LearnSphere' },
        locale: 'de',
        fields: {
            description:
                'Ein Prototyp einer Lernplattform zum Üben von Schulfächern und Fähigkeiten, mit personalisierter Startseite, Kurskatalog, Fortschrittsanzeige und interaktiven Lernmaterialien.',
        },
    },
    {
        match: { title: 'Home Statistics Board' },
        locale: 'de',
        fields: {
            description:
                'Ein Fullstack-Dashboard, das sich mit der Onecta-API von Daikin verbindet und Klima- und Energiedaten von Wärmepumpen und Klimageräten im Haushalt sammelt und darstellt.',
        },
    },
    {
        match: { title: 'Nutrilens' },
        locale: 'de',
        fields: {
            description:
                'KI-gestütztes Ernährungstagebuch: Das Handy auf eine Mahlzeit richten, in Sekunden eine Erkennung bekommen und sie mit einem persönlichen Ernährungsplan abgleichen, mit manueller Eingabe als Alternative und einer Verlaufsansicht für Gewicht und Kalorien.',
        },
    },
    {
        match: { title: 'Metrion' },
        locale: 'de',
        fields: {
            description:
                'Eine mandantenfähige Metrikplattform für Infrastruktur. Anmeldung mit Google, Microsoft oder GitHub, API-Schlüssel pro Projekt, und CPU-, Speicher-, Festplatten- und Netzwerkwerte aus jeder Sprache in eine selbst gehostete TimescaleDB. Ein Abhängigkeitsgraph benennt die Ursache eines Ausfalls, statt jeden nachgelagerten Dienst zu melden.',
        },
    },
    {
        match: { title: 'Burrow' },
        locale: 'de',
        fields: {
            description:
                'Ein privates, selbst gehostetes Datei-Laufwerk, das Hochgeladenes in einen von dir festgelegten Kategorienbaum einsortiert: Ein geplanter KI-Job ordnet Bilder nach Inhalt und andere Dateien nach Typ ein, und jede Datei bekommt eine echte Vorschau im Browser, Freigabelinks und fortsetzbare Uploads für mehrere Gigabyte große Dateien.',
        },
    },
];

const CAREER = [
    {
        match: { title: 'Volksschule' },
        locale: 'en',
        fields: {
            title: 'Primary school',
            organisation: 'Volksschule Völkendorf',
            description: 'Grades 1 to 4.',
            location: 'Villach, Carinthia, Austria',
        },
    },
    {
        match: { title: 'AHS-Unterstufe' },
        locale: 'en',
        fields: {
            title: 'Lower secondary school (AHS)',
            organisation: 'Peraugymnasium',
            description: 'Grades 5 to 8 (AHS lower secondary).',
            location: 'Villach, Carinthia, Austria',
        },
    },
    {
        match: {
            title: 'Reife- und Diplomprüfung — Computer/Information Technology Administration and Management',
        },
        locale: 'en',
        fields: {
            title: 'Reife- und Diplomprüfung (HTL diploma) — Computer/Information Technology Administration and Management',
            organisation: 'HTL Villach',
            description:
                'Graduated with distinction, grade average 1.57. Active in the buddy system supporting new students.',
            location: 'Villach, Carinthia, Austria',
        },
    },
    {
        match: { title: 'Technischer IT-Support', organisation: 'Infineon Technologies' },
        locale: 'en',
        fields: {
            title: 'Technical IT support',
            organisation: 'Infineon Technologies',
            location: 'Villach, Carinthia, Austria',
        },
    },
    {
        match: {
            title: 'Softwareingenieur:in',
            description: 'Ferialpraktikum: Softwareentwicklung im Halbleiterbereich.',
        },
        locale: 'en',
        fields: {
            title: 'Software engineer',
            organisation: 'Infineon Technologies',
            description: 'Summer internship: software development in the semiconductor field.',
            location: 'Villach, Carinthia, Austria',
        },
    },
    {
        match: {
            title: 'Softwareingenieur:in',
            description: 'Experiments Management System (Dashboard)',
        },
        locale: 'en',
        fields: {
            title: 'Software engineer',
            organisation: 'Infineon Technologies',
            description: 'Experiments Management System (dashboard)',
            location: 'Villach, Carinthia, Austria',
        },
    },
    {
        match: { title: 'Soldat' },
        locale: 'en',
        fields: {
            title: 'Soldier',
            organisation: 'Austrian Armed Forces',
            description: 'Full time, basic military service.',
            location: 'Villach, Carinthia, Austria',
        },
    },
];

export { SERVICES, PROJECTS, CAREER };
