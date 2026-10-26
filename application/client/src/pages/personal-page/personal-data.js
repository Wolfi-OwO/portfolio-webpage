// Example content for the Personal page (static, there is no API for it yet).
export const P = {
    main: {
        t: 'Hoodie weather',
        src: '/assets/sona/hoodie.webp',
        thumb: '/assets/sona/hoodie-crop.webp',
    },
    gallery: [
        {
            t: 'Reference sheet',
            cap: 'The whole sheet',
            src: '/assets/sona/ref-full.webp',
            r: '1900/1182',
        },
        {
            t: 'Headshot',
            src: '/assets/sona/headshot.webp',
            r: '1200/1101',
        },
        {
            t: 'Sunset by the sea',
            src: '/assets/sona/beach.webp',
            r: '1400/868',
        },
        {
            t: 'Kiss on the cheek',
            src: '/assets/sona/kiss.webp',
            r: '2000/665',
        },
        {
            t: 'Golden hour',
            src: '/assets/sona/bedroom.webp',
            r: '1600/525',
        },
    ],
    hobbies: [
        {
            t: 'Software engineering',
            icon: 'code',
            tags: [],
        },
        {
            t: 'Ethical hacking',
            icon: 'shield',
            tags: [],
        },
        {
            t: 'Mountaineering',
            icon: 'mountain',
            tags: ['Großglockner', 'Matterhorn'],
        },
        {
            t: 'Rock climbing',
            icon: 'climb',
            tags: ['7c'],
        },
        {
            t: 'Gaming',
            icon: 'pad',
            tags: [],
        },
    ],
    favs: {
        films: ['Who Am I', 'Jigsaw / Scream series', 'Documentaries', 'The Rookie'],
        games: [
            'Dead by Daylight',
            'FNAF series',
            'Winter Resort Simulator 2',
            'Bloons TD6',
            'Phasmophobia',
            'GTA 5',
            'Rainbow Six Siege',
        ],
        interests: ['Computer science', 'Geology', 'Natural sciences (physics, chemistry)'],
        music: 'Everything, really.',
    },
    // Snapshot of the YouTube Music history (the account has no public listening API); refresh by hand.
    music: [
        {
            t: 'Take Me Back (Robin Schulz Remix)',
            a: 'Kygo, Max McNown',
            al: '',
            h: [255, 300],
            vid: 'LVDOdPtUies',
        },
        {
            t: 'Flowers',
            a: 'Alle Farben, Graham Candy, Lahos',
            al: '',
            h: [190, 230],
            vid: 'QXmjzQypkjQ',
        },
        {
            t: 'Do It Better (feat. Zoe Wees)',
            a: 'Felix Jaehn',
            al: '',
            h: [330, 20],
            vid: 'uWB9JQP3R1Q',
        },
        {
            t: 'Rain In Ibiza (feat. Calum Scott)',
            a: 'Felix Jaehn, The Stickmen Project',
            al: '',
            h: [150, 190],
            vid: 'SC3yh6gj0Ck',
        },
        {
            t: 'Wait (Alibi Blue)',
            a: 'VIZE',
            al: 'Wait (Alibi Blue)',
            h: [40, 80],
            vid: 'vmKK1wLQFCU',
        },
    ],
    artists: [
        ['[Artist one]', 93, [255, 300]],
        ['[Artist two]', 71, [190, 230]],
        ['[Artist three]', 52, [330, 20]],
        ['[Artist four]', 38, [150, 190]],
        ['[Artist five]', 27, [40, 80]],
    ],
    bio: "I'm a software developer from Carinthia. I graduated from HTL Villach in 2026 with a Reife- und Diplomprüfung in computer science, and I've done software engineering internships at Infineon Technologies. I work on web applications, on apps in general — Android and desktop among them — and on projects in data science and AI.",
};
