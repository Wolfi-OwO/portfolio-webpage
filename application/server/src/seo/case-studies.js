// Case studies, in both languages, in one file: the server writes them into the HTML it sends and the client
// renders the same words, so what a crawler reads first is what a visitor reads. No imports, the client bundles it.
//
// Every claim here is a fact the project's own README or ADRs record. Add numbers only when they are measured.

export const CASE_STUDIES = [
    {
        slug: 'burrow',
        name: 'Burrow',
        repo: 'https://github.com/Wolfi-OwO/burrow',
        live: 'https://burrow.woofi-developments.at',
        stack: [
            'Node.js',
            'Express',
            'PostgreSQL + pgvector',
            'Python',
            'FastAPI',
            'ONNX Runtime',
            'React',
        ],
        en: {
            kind: 'Private file drive with picture sorting',
            summary:
                'A self-hosted drive that files pictures into your own folder tree by what is in them, and learns from every correction.',
            problem:
                'Thousands of pictures pile up in one place, and sorting them by hand never happens. Cloud vision services refuse to classify adult content, so a private archive cannot use them, and a sorter that guesses silently makes the mess worse.',
            decisions: [
                {
                    title: 'The model runs on the same server',
                    body: 'Picture recognition lives in its own Python service (OpenCLIP and a dedicated NSFW classifier on ONNX Runtime) that only returns scores. The Node API owns users, files and the folder tree. No picture leaves the machine, and either service can be replaced on its own.',
                },
                {
                    title: 'Zero-shot against your own folder names',
                    body: 'Categories are whatever you call them, so each picture is scored against your folder names under several phrasings, level by level down the tree. A folder pair of SFW and NSFW is decided by the NSFW classifier instead, because zero-shot labels are unreliable for that.',
                },
                {
                    title: 'It never guesses silently',
                    body: 'A confident score files the picture, a middling one goes to a review queue, and a picture nothing fits stays unsorted. Turning down a suggestion in review is remembered, so the same wrong guess is not offered again.',
                },
                {
                    title: 'It learns from what you file',
                    body: 'Every picture you file by hand becomes an example. A new picture that looks like those goes where you put them, weighted against what the folder name alone suggests. The decision is recorded in an architecture decision record.',
                },
                {
                    title: 'Big files and long jobs survive restarts',
                    body: 'Uploads are sent in 16 MB pieces, each retried on its own, so a 7 GB file is not one fragile request. Sorting and duplicate removal run as background jobs with a progress bar that survives closing the browser and a server restart.',
                },
            ],
            result: 'Burrow is in daily use and public. It stores files once by content, keeps an encrypted offsite backup and ships through a gated release pipeline.',
        },
        de: {
            kind: 'Private Dateiablage mit Bildsortierung',
            summary:
                'Eine selbst gehostete Ablage, die Bilder nach ihrem Inhalt in deinen eigenen Ordnerbaum einsortiert und aus jeder Korrektur lernt.',
            problem:
                'Tausende Bilder sammeln sich an einem Ort, und von Hand sortiert sie niemand. Cloud-Bilderkennung verweigert die Einordnung von Inhalten für Erwachsene, ein privates Archiv kann sie also nicht nutzen, und ein Sortierer, der stillschweigend rät, macht die Unordnung nur größer.',
            decisions: [
                {
                    title: 'Das Modell läuft auf demselben Server',
                    body: 'Die Bilderkennung steckt in einem eigenen Python-Dienst (OpenCLIP und ein eigener NSFW-Klassifikator auf ONNX Runtime), der nur Werte zurückgibt. Die Node-API besitzt Nutzer, Dateien und den Ordnerbaum. Kein Bild verlässt die Maschine, und jeder der beiden Dienste lässt sich einzeln austauschen.',
                },
                {
                    title: 'Zero-Shot gegen deine eigenen Ordnernamen',
                    body: 'Kategorien heißen, wie du sie nennst. Darum wird jedes Bild gegen deine Ordnernamen in mehreren Formulierungen bewertet, Ebene für Ebene den Baum hinab. Ein Paar aus SFW und NSFW entscheidet stattdessen der NSFW-Klassifikator, weil Zero-Shot-Labels dafür unzuverlässig sind.',
                },
                {
                    title: 'Es rät nie stillschweigend',
                    body: 'Ein sicherer Wert sortiert das Bild ein, ein mittlerer schickt es in eine Prüfwarteschlange, und ein Bild, zu dem nichts passt, bleibt unsortiert. Lehnst du einen Vorschlag in der Prüfung ab, wird das gemerkt, und derselbe falsche Tipp kommt nicht noch einmal.',
                },
                {
                    title: 'Es lernt aus dem, was du ablegst',
                    body: 'Jedes Bild, das du von Hand ablegst, wird zum Beispiel. Ein neues Bild, das so aussieht, landet dort, wo du die ähnlichen hingelegt hast, gewichtet gegen das, was der Ordnername allein nahelegt. Die Entscheidung ist in einem Architecture Decision Record festgehalten.',
                },
                {
                    title: 'Große Dateien und lange Aufgaben überstehen Neustarts',
                    body: 'Uploads gehen in 16-MB-Stücken hinaus, jedes mit eigener Wiederholung, eine 7-GB-Datei ist also keine einzelne zerbrechliche Anfrage. Sortieren und Duplikate entfernen laufen als Hintergrundaufgaben mit einem Fortschrittsbalken, der das Schließen des Browsers und einen Serverneustart überlebt.',
                },
            ],
            result: 'Burrow ist täglich im Einsatz und öffentlich. Dateien werden nach Inhalt nur einmal gespeichert, es gibt ein verschlüsseltes Offsite-Backup, und Releases laufen durch eine Pipeline mit Freigabe.',
        },
    },
    {
        slug: 'netviz',
        name: 'NetViz',
        repo: 'https://github.com/Wolfi-OwO/network-visualizer',
        live: 'https://netviz.woofi-developments.at',
        stack: ['React', 'React Flow', 'TypeScript', 'Node.js', 'Express', 'MongoDB'],
        en: {
            kind: 'Network designer and packet simulator',
            summary:
                'A browser tool to draw a network, power devices on, and watch simulated packets cross it hop by hop, with a CIDR calculator built in.',
            problem:
                'Networking is hard to learn from diagrams alone, and a real lab needs hardware. Students and engineers want to see why a packet is dropped, which firewall rule matched or where NAT rewrote an address.',
            decisions: [
                {
                    title: 'A simulation that follows real rules',
                    body: 'A sent packet is traced hop by hop with longest-prefix routing, firewall ACLs with an implicit deny, NAT at the edge, TTL and VLAN isolation. Powering a device on broadcasts DHCP and gives it an address, and powering one off stops traffic crossing it.',
                },
                {
                    title: 'Live capture over Server-Sent Events',
                    body: 'The packet feed is one-directional, so it streams over plain HTTP with Server-Sent Events rather than WebSockets. Sixteen-plus protocols are generated realistically, with per-protocol toggles, a protocol tree and a hex dump.',
                },
                {
                    title: 'One image, one origin',
                    body: 'The backend serves the built single-page app from the same image, so there is one thing to deploy and no cross-origin configuration. Sessions are signed JWTs in an httpOnly cookie, with roles for admin, editor and viewer.',
                },
                {
                    title: 'Every pull request gets a running preview',
                    body: 'Instead of a diff to imagine, each pull request builds its own container with its own address. Publishing a GitHub release is the only thing that ships production.',
                },
            ],
            result: 'NetViz is public. The CIDR calculator is a page of its own, with subnet and wildcard masks, a subnet splitter and supernet summarisation.',
        },
        de: {
            kind: 'Netzwerk-Designer und Paketsimulator',
            summary:
                'Ein Browser-Werkzeug zum Zeichnen eines Netzwerks, Einschalten von Geräten und Beobachten simulierter Pakete Hop für Hop, mit eingebautem CIDR-Rechner.',
            problem:
                'Netzwerktechnik lässt sich aus Diagrammen allein schwer lernen, und ein echtes Labor braucht Hardware. Lernende und Techniker wollen sehen, warum ein Paket verworfen wird, welche Firewall-Regel gegriffen hat oder wo NAT eine Adresse umgeschrieben hat.',
            decisions: [
                {
                    title: 'Eine Simulation nach echten Regeln',
                    body: 'Ein gesendetes Paket wird Hop für Hop verfolgt, mit Longest-Prefix-Routing, Firewall-ACLs mit implizitem Deny, NAT am Rand, TTL und VLAN-Isolation. Ein eingeschaltetes Gerät sendet DHCP und bekommt eine Adresse, ein ausgeschaltetes lässt keinen Verkehr mehr durch.',
                },
                {
                    title: 'Live-Mitschnitt über Server-Sent Events',
                    body: 'Der Paketstrom läuft nur in eine Richtung, darum fließt er per Server-Sent Events über einfaches HTTP statt über WebSockets. Über sechzehn Protokolle werden realistisch erzeugt, mit Schaltern je Protokoll, Protokollbaum und Hexdump.',
                },
                {
                    title: 'Ein Image, ein Origin',
                    body: 'Das Backend liefert die gebaute Single-Page-App aus demselben Image, es gibt also genau eine Sache zu deployen und keine Cross-Origin-Konfiguration. Sitzungen sind signierte JWTs in einem httpOnly-Cookie, mit den Rollen Admin, Editor und Viewer.',
                },
                {
                    title: 'Jeder Pull Request bekommt eine laufende Vorschau',
                    body: 'Statt eines Diffs, den man sich vorstellen muss, baut jeder Pull Request einen eigenen Container mit eigener Adresse. Das Veröffentlichen eines GitHub-Releases ist das Einzige, was die Produktion ausliefert.',
                },
            ],
            result: 'NetViz ist öffentlich. Der CIDR-Rechner hat eine eigene Seite, mit Subnetz- und Wildcard-Masken, Subnetz-Aufteilung und Supernetz-Zusammenfassung.',
        },
    },
    {
        slug: 'metrion',
        name: 'Metrion',
        repo: 'https://github.com/Wolfi-OwO/metrion',
        live: null,
        stack: ['TypeScript', 'Node.js', 'PostgreSQL + TimescaleDB', 'React', 'zod', 'OpenAPI'],
        en: {
            kind: 'Self-hosted metrics and uptime platform',
            summary:
                'One authenticated endpoint that any program, in any language, posts numbers to, and a viewer that draws them as charts.',
            problem:
                'Three things were about to measure the same numbers on their own: a server collector, an overload alarm and a status page tile. Separate pipelines drift apart, and the numbers stop agreeing.',
            decisions: [
                {
                    title: 'One source for every number',
                    body: 'There is exactly one write path, an ingest endpoint that takes a generic metric envelope. The same shape carries a server’s CPU, a container’s restarts, a site’s latency or an uptime check’s up or down.',
                },
                {
                    title: 'The key decides the tenant',
                    body: 'Each project has its own API key, and tenancy is resolved from the key alone, never from anything in the request. No SDK is needed: a plain HTTP client is enough, and the quickstart has a complete program per language.',
                },
                {
                    title: 'A time-series database, not a pile of blobs',
                    body: 'Writes land in PostgreSQL with TimescaleDB as a real hypertable with continuous aggregates and retention policies. The viewer reads through an account-scoped query API and charts everything on one shared time axis.',
                },
                {
                    title: 'Documentation generated from the same schemas',
                    body: 'The OpenAPI site is generated from the zod schemas the API validates with, so the documentation cannot describe something the API does not do. The pipeline stores no client IPs, user agents or request paths.',
                },
            ],
            result: 'The portfolio’s status page reads its uptime from Metrion, which is the second use case that turned the collector into a proper write API.',
        },
        de: {
            kind: 'Selbst gehostete Metrik- und Uptime-Plattform',
            summary:
                'Ein authentifizierter Endpunkt, an den jedes Programm in jeder Sprache Zahlen schickt, und ein Viewer, der sie als Diagramme zeichnet.',
            problem:
                'Drei Dinge wollten gleichzeitig dieselben Zahlen messen: ein Server-Collector, ein Überlast-Alarm und eine Kachel auf der Statusseite. Getrennte Pipelines laufen auseinander, und die Zahlen stimmen nicht mehr überein.',
            decisions: [
                {
                    title: 'Eine Quelle für jede Zahl',
                    body: 'Es gibt genau einen Schreibweg, einen Ingest-Endpunkt mit einem generischen Metrik-Umschlag. Dieselbe Form trägt die CPU eines Servers, die Neustarts eines Containers, die Latenz einer Website oder das Oben oder Unten eines Uptime-Checks.',
                },
                {
                    title: 'Der Schlüssel bestimmt den Mandanten',
                    body: 'Jedes Projekt hat einen eigenen API-Schlüssel, und der Mandant wird allein aus dem Schlüssel bestimmt, nie aus dem Inhalt der Anfrage. Ein SDK ist nicht nötig, ein einfacher HTTP-Client genügt, und die Schnellstartanleitung enthält ein vollständiges Programm je Sprache.',
                },
                {
                    title: 'Eine Zeitreihendatenbank statt eines Haufens Blobs',
                    body: 'Schreibzugriffe landen in PostgreSQL mit TimescaleDB als echte Hypertable mit Continuous Aggregates und Aufbewahrungsrichtlinien. Der Viewer liest über eine kontobezogene Abfrage-API und zeichnet alles auf einer gemeinsamen Zeitachse.',
                },
                {
                    title: 'Dokumentation aus denselben Schemas',
                    body: 'Die OpenAPI-Seite wird aus den zod-Schemas erzeugt, mit denen die API prüft, die Dokumentation beschreibt also nichts, was die API nicht tut. Die Pipeline speichert keine Client-IPs, User-Agents oder Anfragepfade.',
                },
            ],
            result: 'Die Statusseite des Portfolios liest ihre Verfügbarkeit aus Metrion, dem zweiten Anwendungsfall, der aus dem Collector eine richtige Schreib-API gemacht hat.',
        },
    },
];

export const CASE_STUDY_ROUTES = CASE_STUDIES.map((s) => `/case-studies/${s.slug}`);

export const studyBySlug = (slug) => CASE_STUDIES.find((s) => s.slug === slug);

export const INDEX_COPY = {
    en: {
        h1: 'Case studies',
        lead: 'How three of my projects were built, and why each decision went the way it did.',
        read: 'Read the case study',
        back: 'All case studies',
        problem: 'The problem',
        decisions: 'Decisions that mattered',
        result: 'Where it stands',
        stack: 'Built with',
        live: 'Open the live app',
        repo: 'Source on GitHub',
    },
    de: {
        h1: 'Fallstudien',
        lead: 'Wie drei meiner Projekte gebaut wurden und warum jede Entscheidung so ausgefallen ist.',
        read: 'Fallstudie lesen',
        back: 'Alle Fallstudien',
        problem: 'Das Problem',
        decisions: 'Entscheidungen, die zählten',
        result: 'Stand heute',
        stack: 'Gebaut mit',
        live: 'Live-App öffnen',
        repo: 'Quellcode auf GitHub',
    },
};
