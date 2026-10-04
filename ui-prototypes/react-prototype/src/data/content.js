// Real copy and data lifted from the repo (identity.js, de.js, homepage.jsx, database/data/*.json).
export const C = {
  name: 'Wolfi', handle: 'Wolfi-OwO', email: 'koflerphillip@outlook.com', discord: 'woofiowo',
  role: 'Fullstack developer / Carinthia, Austria',
  bio: "I'm a software developer from Carinthia. I graduated from HTL Villach in 2026 with a Reife- und Diplomprüfung in computer science, and I've done software engineering internships at Infineon Technologies. I work on web applications, on apps in general — Android and desktop among them — and on projects in data science and AI.",
  availability: { badge: 'Open for commissions', intro: "I'm open for work, but I want to be honest about the calendar: until the end of September I'm interning, from October I serve my six months at the Bundesheer. Small freelance jobs fit alongside — anything bigger realistically starts in April 2027." },
  tech: ['JavaScript','TypeScript','React','Angular','Tailwind CSS','Node.js','Express','Spring Boot','Java','Kotlin','.NET Core','Docker','Azure','GitHub Actions','MongoDB','PostgreSQL','SQL','Git'],
  projects: [
    { t: 'Machine Learning Visualizer', d: 'A tutoring site, helping students master basic machine learning algorithms.', tech: ['Python','Streamlit'], live: 'ml-visualizer.at' },
    { t: 'Alpinfex', d: 'A blog website for enthusiastic mountaineers who want to share their experiences with others.', tech: ['React','NodeJs','Express','TailwindCSS'] },
    { t: 'NetViz', d: 'Design, visualize and simulate real enterprise networks in the browser — a drag-and-drop topology builder with live hop-by-hop packet simulation, a Wireshark-style capture view, and a CIDR calculator.', tech: ['React','TypeScript','TailwindCSS','Express','MongoDB','Docker'], live: 'netviz.woofi-developments.at' },
    { t: 'Metrion', d: 'A multi-tenant infrastructure metrics platform — sign in with Google, Microsoft or GitHub, issue per-project API keys, and stream CPU, memory, disk and network metrics from any language into a self-hosted TimescaleDB.', tech: ['React','TypeScript','TailwindCSS','Express','PostgreSQL','Docker'], live: 'metrion-viewer.azurecontainerapps.io' },
    { t: 'Image Upscaler', d: "A free, AI-powered command-line tool that upscales images up to 16× using Real-ESRGAN, with GPU acceleration and a graceful Lanczos fallback when the AI stack isn't available.", tech: ['Python','Docker'] },
    { t: 'LearnSphere', d: 'A learning-platform prototype for practising school subjects and skills, featuring a personalized landing page, course catalog, progress tracking and interactive materials.', tech: ['React','Vite','Bootstrap'] },
    { t: 'Home Statistics Board', d: "A full-stack dashboard that connects to Daikin's Onecta API to collect and visualize home climate and energy statistics from heat-pump and AC units.", tech: ['React','Vite','Express'] },
  ],
  career: [
    { t: 'Software Engineer (internship)', o: 'Infineon Technologies', loc: 'Villach, Carinthia', from: 'Jul 2026', to: 'Sep 2026', k: 'work', d: 'Internship building the Experiments Management System dashboard for semiconductor manufacturing, on site in Villach.', tags: ['Angular','ASP.NET','PHP','JavaScript'] },
    { t: 'Software Engineer (internship)', o: 'Infineon Technologies', from: 'Jul 2025', to: 'Aug 2025', k: 'work' },
    { t: 'Software Engineer (internship)', o: 'Infineon Technologies', from: 'Jul 2024', to: 'Jul 2024', k: 'work' },
    { t: 'Technical IT support', o: 'Infineon Technologies', from: 'Aug 2023', to: 'Aug 2023', k: 'work' },
    { t: 'Reife- und Diplomprüfung — Computer/Information Technology Administration and Management', o: 'HTL Villach', from: 'Sep 2021', to: 'Jun 2026', k: 'education' },
    { t: 'AHS-Unterstufe', o: 'BG/BRG Peraugymnasium', from: 'Sep 2015', to: 'Jul 2019', k: 'education' },
  ],
  timeline: [
    { t: 'Internship', d: 'Full-time software developer internship.', from: '13 Jul 2026', to: '30 Sep 2026', k: 'work', state: 'done' },
    { t: 'Bundesheer', d: 'Basic military service — six months.', from: '5 Oct 2026', to: '5 Apr 2027', k: 'military', state: 'now' },
    { t: 'Available again', d: 'Free for full-time and larger freelance projects.', from: '6 Apr 2027', to: 'open', k: 'available', state: 'next' },
  ],
  services: [
    { t: 'Website', cat: 'Web', d: 'A fast, modern website — landing page, portfolio or company presence. Responsive, accessible and free of page-builder baggage.', del: ['Design and build with React and Tailwind','Responsive from phone to desktop','Contact options and legal pages','Deployment including domain setup'], price: 'from €600', rate: '€30 / h', dur: '1–3 weeks' },
    { t: 'Web application', cat: 'Web', d: 'A real application in the browser: login, database, your own API. Everything beyond a website.', del: ['Frontend with React','REST API with Node.js and Express','Database (MongoDB or PostgreSQL)','User management and authentication'], price: 'on request', rate: '€30 / h', dur: 'after a conversation' },
    { t: 'Android app', cat: 'Mobile', d: 'Native Android apps in Kotlin.', del: [], price: 'on request', rate: '€30 / h', dur: 'after a conversation' },
    { t: 'Desktop application', cat: 'Desktop', d: 'Desktop interfaces with JavaFX or .NET.', del: [], price: 'on request', rate: '€30 / h', dur: 'after a conversation' },
    { t: 'Small jobs and maintenance', cat: 'Other', d: 'Fixes, upgrades and small features on existing projects.', del: [], price: 'by the hour', rate: '€30 / h', dur: 'flexible' },
  ],
  servicesIntro: "Websites, web applications, Android apps in Kotlin and desktop interfaces with JavaFX or .NET. The prices below are starting points, not quotes — what a project really costs depends on what it has to do. I'd rather tell you that honestly after a conversation than pretend a number on a page knows.",
  contact: [
    { k: 'Email', v: 'koflerphillip@outlook.com', n: 'Best for project work. I read it every day.' },
    { k: 'GitHub', v: 'Wolfi-OwO', n: 'Everything I build in the open.' },
    { k: 'LinkedIn', v: 'in/kofler-phillip', n: 'Work history, if you need it.' },
    { k: 'Discord', v: 'woofiowo', n: 'Fastest for a quick question. Click to copy.' },
    { k: 'Telegram', v: '@WolfiOwO', n: 'Quick hello, no email needed.' },
    { k: 'Barq', v: '@Woofi', n: 'My profile in the furry community.' },
  ],
  contactIntro: 'Freelance work, collaboration, or a question about something I built. Pick whichever channel suits you. I usually reply within a day or two.',
  status: [
    { n: 'Portfolio', up: 99.98, ms: 84, ok: true },
    { n: 'Network Visualizer', up: 99.71, ms: 212, ok: true },
    { n: 'Machine Learning Visualizer', up: 99.42, ms: 640, ok: true },
    { n: 'Nutrilens', up: 99.9, ms: 143, ok: true },
    { n: 'Preussen Web', up: 98.87, ms: 301, ok: false },
    { n: 'Status Page', up: 100, ms: 61, ok: true },
  ],
  boot: [
    ['cmd', 'node server/src/server.js'], ['log', 'Backend - Starting configuration...'], ['log', 'Backend - Starting up ...'],
    ['log', 'DB - Setting up connection using mongodb+srv://***'], ['log', 'DB - Connection established.'],
    ['log', 'Backend - Running on port 8080...'], ['ready', 'ready'],
  ],
  privacyIntro: "I built this site myself and I run it myself — so I can tell you exactly what happens with your data: as little as possible. There are no analytics tools, no tracking, no ads and no cookie banner, because there is simply nothing you would need to consent to.",
  privacyShort: "I collect no personal data about you beyond what a web server necessarily sees when it answers your request, and what you send me yourself through the contact form. I set no cookies.",
  imprint: 'Phillip Kofler · Software developer | Fullstack Developer · Villach, Carinthia, Austria',
};
// Deterministic pseudo activity so the heatmap mockup is stable between loads.
export const heat = (() => { let s = 7; const r = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  return Array.from({ length: 53 * 7 }, (_, i) => { const w = Math.floor(i / 7), d = i % 7; const base = (d > 0 && d < 6 ? 0.62 : 0.28) * (0.4 + 0.6 * Math.sin(w / 5) ** 2 + 0.2);
    return r() < base ? Math.ceil(r() * 4) : 0; }); })();

// ---- additions that live next to the seed data (same values as the mockup) ----
C.main = { t: 'Hoodie weather', src: '/assets/sona/hoodie.webp', thumb: '/assets/sona/hoodie-crop.webp' };
C.gallery = [
  { t: 'Reference sheet', cap: 'The whole sheet', src: '/assets/sona/ref-full.webp', r: '1900/1182' },
  { t: 'Headshot', src: '/assets/sona/headshot.webp', r: '1200/1101' },
  { t: 'Sunset by the sea', src: '/assets/sona/beach.webp', r: '1400/868' },
  { t: 'Kiss on the cheek', src: '/assets/sona/kiss.webp', r: '2000/665' },
  { t: 'Golden hour', src: '/assets/sona/bedroom.webp', r: '1600/525' },
];
C.hobbies = [
  { t: 'Software engineering', icon: 'code', tags: [] }, { t: 'Ethical hacking', icon: 'shield', tags: [] },
  { t: 'Mountaineering', icon: 'mountain', tags: ['Großglockner', 'Matterhorn'] }, { t: 'Rock climbing', icon: 'climb', tags: ['7c'] }, { t: 'Gaming', icon: 'pad', tags: [] },
];
C.favs = { films: ['Who Am I', 'Jigsaw / Scream series', 'Documentaries', 'The Rookie'], games: ['Dead by Daylight', 'FNAF series', 'Winter Resort Simulator 2', 'Bloons TD6', 'Phasmophobia', 'GTA 5', 'Rainbow Six Siege'], interests: ['Computer science', 'Geology', 'Natural sciences (physics, chemistry)'], music: 'Everything, really.' };
// vid = a YouTube video id; when set, the cover is that video's thumbnail. Empty = generated art.
C.music = [
  { t: '[Track one]', a: '[Artist]', al: '[Album]', p: 94, h: [255, 300], vid: '' }, { t: '[Track two]', a: '[Artist]', al: '[Album]', p: 71, h: [190, 230], vid: '' },
  { t: '[Track three]', a: '[Artist]', al: '[Album]', p: 58, h: [330, 20], vid: '' }, { t: '[Track four]', a: '[Artist]', al: '[Album]', p: 40, h: [150, 190], vid: '' },
  { t: '[Track five]', a: '[Artist]', al: '[Album]', p: 33, h: [40, 80], vid: '' },
];
C.artists = [['[Artist one]', 93, [255, 300]], ['[Artist two]', 71, [190, 230]], ['[Artist three]', 52, [330, 20]], ['[Artist four]', 38, [150, 190]], ['[Artist five]', 27, [40, 80]]];
C.ai = { score: 4, provider: 'Sample detector (connect GPTZero, Originality.ai or Sapling)', checked: '4 Oct 2026, 11:20', pages: [['Home', 3], ['Projects', 2], ['Career', 1], ['Services', 9], ['Personal', 6], ['Contact', 2], ['Privacy policy', 0], ['Imprint', 0]] };
C.messages = [
  { n: 'Anna Berger', e: 'anna.berger@example.com', s: 'Website für unseren Verein', b: 'Hallo Wolfi, wir sind ein kleiner Verein aus Klagenfurt und suchen jemanden, der uns eine neue Website baut. Wäre das im April möglich? Wir hätten ca. 8 Seiten und einen Kalender.', d: '2 hours ago', left: 89, unread: true },
  { n: 'Markus Huber', e: 'markus@example.com', s: 'Frage zu NetViz', b: 'Tolles Projekt! Gibt es eine Möglichkeit, Topologien als JSON zu exportieren und wieder zu importieren?', d: 'yesterday', left: 88, unread: true },
  { n: 'Lea Winter', e: 'lea.w@example.com', s: 'Android-App Prototyp', b: 'Wir brauchen einen klickbaren Prototyp für eine Fitness-App, Budget ca. 1.500 €.', d: '3 days ago', left: 86, unread: false },
];
C.monitors = ['Network Visualizer', 'Machine Learning Visualizer', 'Machine Learning Visualizer (Preview)', 'Nutrilens', 'Portfolio', 'Status Page', 'Preussen Web'];
C.projects.forEach((p) => { if (p.t === 'NetViz') p.shot = '/shots/proj/netviz.png'; if (p.t === 'Machine Learning Visualizer') p.shot = '/shots/proj/ml.png'; });
