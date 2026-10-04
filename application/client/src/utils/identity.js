import { DiscordIcon, GitHubIcon, MailIcon } from '../components/social-icons.jsx';

// Single source of truth for who I am and where to reach me — imported by both
// the homepage profile card and the contact page so the two can never drift.
// The public persona is "Wolfi"; the civil name lives only on the legal pages
// (imprint and privacy controller block), which §5 ECG and Art. 13 GDPR require.
// The one address that actually reaches me. It contains my surname, so it leaks
// the civil name wherever it is shown: replace it here (and in SECURITY.md and
// .github/ISSUE_TEMPLATE/config.yml) with a name-free alias on woofi-developments.at
// once one exists. Not invented in the meantime because a dead address would break contact.
const CONTACT_EMAIL = 'koflerphillip@outlook.com';

export const IDENTITY = {
    name: 'Wolfi',
    handle: 'Wolfi-OwO',
    email: CONTACT_EMAIL,
    githubUrl: 'https://github.com/Wolfi-OwO',
    // No longer a SOCIALS chip (the slug contains the civil name). Kept only because the
    // homepage bio still links it; remove together with that sentence in the homepage rewrite.
    linkedInUrl: 'https://www.linkedin.com/in/kofler-phillip-8666ab338/',
    discordHandle: 'woofiowo',
};

export const SOCIALS = [
    {
        key: 'github',
        label: 'GitHub',
        value: 'Wolfi-OwO',
        href: IDENTITY.githubUrl,
        Icon: GitHubIcon,
    },
    // Discord usernames aren't URL-addressable, so this one copies the handle
    // instead of pretending to be a link that would 404.
    {
        key: 'discord',
        label: 'Discord',
        value: IDENTITY.discordHandle,
        copy: IDENTITY.discordHandle,
        Icon: DiscordIcon,
    },
    {
        key: 'email',
        label: 'Email',
        value: IDENTITY.email,
        href: `mailto:${IDENTITY.email}`,
        Icon: MailIcon,
    },
];
