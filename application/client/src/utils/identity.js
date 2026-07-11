import { DiscordIcon, GitHubIcon, LinkedInIcon, MailIcon } from '../components/social-icons.jsx';

// Single source of truth for who I am and where to reach me — imported by both
// the homepage profile card and the contact page so the two can never drift.
export const IDENTITY = {
    name: 'Phillip Kofler',
    handle: '@woofi',
    email: 'koflerphillip@outlook.com',
    githubUrl: 'https://github.com/Wolfi-OwO',
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
    {
        key: 'linkedin',
        label: 'LinkedIn',
        value: 'kofler-phillip',
        href: IDENTITY.linkedInUrl,
        Icon: LinkedInIcon,
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
