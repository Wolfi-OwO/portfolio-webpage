import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import {
    ArrowRightOnRectangleIcon,
    CodeBracketIcon,
    ComputerDesktopIcon,
    LanguageIcon,
    LockClosedIcon,
    MoonIcon,
    SunIcon,
} from '@heroicons/react/24/outline';
import { isAdmin, logout } from '../../utils/auth.js';
import { useLocale, SUPPORTED_LOCALES } from '../../i18n/LocaleContext.jsx';

const themeOptions = [
    { id: 'light', labelId: 'theme.light', defaultLabel: 'Light', Icon: SunIcon },
    { id: 'dark', labelId: 'theme.dark', defaultLabel: 'Dark', Icon: MoonIcon },
    {
        id: 'system',
        labelId: 'theme.system',
        defaultLabel: 'Browser',
        Icon: ComputerDesktopIcon,
    },
];

const languageOptions = {
    en: { labelId: 'language.en', defaultLabel: 'English', short: 'EN' },
    de: { labelId: 'language.de', defaultLabel: 'Deutsch', short: 'DE' },
};

// The two bars share one control shape: a hairline-bordered, softly rounded button
// on a translucent fill. Defined once so the top bar and the dropdowns can't drift.
const CONTROL =
    'inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1.5 text-sm font-medium text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]';

const MENU =
    'absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 [box-shadow:var(--shadow-float)]';

// Shown when /api/info can't be reached — mirrors the server's own defaults.
const FALLBACK_BUILD_INFO = {
    version: 'dev',
    repositoryUrl: 'https://github.com/Wolfi-OwO/portfolio-webpage',
    revision: '',
    buildDate: '',
};

export default function DefaultLayout() {
    const intl = useIntl();
    const { locale, setLocale } = useLocale();
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'system';
    });
    const [openDropdown, setOpenDropdown] = useState(null); // 'theme' | 'language' | null
    const [buildInfo, setBuildInfo] = useState(null);
    const [loggedIn, setLoggedIn] = useState(() => isAdmin());
    const themeDropdownRef = useRef(null);
    const languageDropdownRef = useRef(null);
    const scrollRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        (() => {
            setLoggedIn(isAdmin());
        })();
    }, [location.pathname]);

    // The window never scrolls — <main> does — so react-router's own scroll
    // restoration has nothing to reset. Send the scroll container home instead.
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [location.pathname]);

    async function handleLogout() {
        await logout();
        setLoggedIn(false);
        navigate('/');
    }

    useEffect(() => {
        let active = true;

        fetch('/api/info')
            .then((res) => (res.ok ? res.json() : null))
            .then((info) => {
                if (active) setBuildInfo(info || FALLBACK_BUILD_INFO);
            })
            .catch(() => {
                // The backend is the only source of the real build metadata, but a
                // footer that silently loses its version chip whenever /api/info is
                // unreachable (dev without the server, a brief outage) just reads as
                // a bug. Fall back to the same 'dev' the server itself defaults to.
                if (active) setBuildInfo(FALLBACK_BUILD_INFO);
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                openDropdown === 'theme' &&
                themeDropdownRef.current &&
                !themeDropdownRef.current.contains(event.target)
            ) {
                setOpenDropdown(null);
            }
            if (
                openDropdown === 'language' &&
                languageDropdownRef.current &&
                !languageDropdownRef.current.contains(event.target)
            ) {
                setOpenDropdown(null);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [openDropdown]);

    useLayoutEffect(() => {
        const root = document.documentElement;

        const applyTheme = () => {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            const isDark = theme === 'dark' || (theme === 'system' && systemDark);

            root.classList.toggle('dark', isDark);
        };

        applyTheme();

        localStorage.setItem('theme', theme);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', applyTheme);

        return () => {
            mediaQuery.removeEventListener('change', applyTheme);
        };
    }, [theme]);

    const selectedTheme = themeOptions.find((option) => option.id === theme);

    const navLinkClasses = ({ isActive }) =>
        `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            isActive
                ? 'bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--text)]'
                : 'text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] hover:text-[var(--text)]'
        }`;

    return (
        // The whole app is one viewport-tall column that never scrolls itself:
        // the bars are fixed rows, and only <main> in the middle moves.
        <div className="relative flex h-dvh flex-col overflow-hidden bg-[var(--bg)] text-[var(--text)] transition-colors duration-300">
            <div className="app-ground" aria-hidden="true" />
            <div className="app-glow" aria-hidden="true" />

            {/* Floating top bar: out of flow, so it hovers over the scrolling content.
                The wrapper is click-through; only the bar itself takes pointer events. */}
            <header className="pointer-events-none absolute inset-x-0 top-0 z-40 px-4 pt-2 sm:px-4 sm:pt-3">
                <nav className="max-w-8xl pointer-events-auto mx-auto flex h-14 items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--glass)] pl-3 pr-2 backdrop-blur-xl [box-shadow:var(--shadow-float)]">
                    <div className="flex min-w-0 items-center gap-1 sm:gap-2">
                        <NavLink
                            to="/"
                            className="mr-1 flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        >
                            <img src="/favicon.svg" alt="" className="h-7 w-7 rounded-md" />
                            <span className="hidden text-base font-extrabold tracking-tight sm:inline">
                                Woofi
                                <span className="text-[var(--muted)]">-Developments</span>
                            </span>
                        </NavLink>

                        <NavLink to="/projects" className={navLinkClasses}>
                            <FormattedMessage id="nav.projects" defaultMessage="Projects" />
                        </NavLink>

                        <NavLink to="/services" className={navLinkClasses}>
                            <FormattedMessage id="nav.services" defaultMessage="Services" />
                        </NavLink>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                        <div className="relative" ref={languageDropdownRef}>
                            <button
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={openDropdown === 'language'}
                                aria-label={intl.formatMessage({
                                    id: 'language.label',
                                    defaultMessage: 'Language',
                                })}
                                onClick={() =>
                                    setOpenDropdown((open) =>
                                        open === 'language' ? null : 'language',
                                    )
                                }
                                className={CONTROL}
                            >
                                <LanguageIcon className="h-4 w-4" />
                                <span className="font-mono text-xs">
                                    {languageOptions[locale].short}
                                </span>
                            </button>

                            {openDropdown === 'language' && (
                                <div className={MENU} role="menu">
                                    {SUPPORTED_LOCALES.map((code) => (
                                        <MenuItem
                                            key={code}
                                            selected={locale === code}
                                            onClick={() => {
                                                setLocale(code);
                                                setOpenDropdown(null);
                                            }}
                                        >
                                            <span className="font-mono text-xs text-[var(--accent)]">
                                                {languageOptions[code].short}
                                            </span>
                                            <span>
                                                {intl.formatMessage({
                                                    id: languageOptions[code].labelId,
                                                    defaultMessage:
                                                        languageOptions[code].defaultLabel,
                                                })}
                                            </span>
                                        </MenuItem>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative" ref={themeDropdownRef}>
                            <button
                                type="button"
                                aria-haspopup="menu"
                                aria-expanded={openDropdown === 'theme'}
                                aria-label={intl.formatMessage({
                                    id: 'theme.label',
                                    defaultMessage: 'Theme',
                                })}
                                onClick={() =>
                                    setOpenDropdown((open) => (open === 'theme' ? null : 'theme'))
                                }
                                className={CONTROL}
                            >
                                {selectedTheme?.Icon && <selectedTheme.Icon className="h-4 w-4" />}
                            </button>

                            {openDropdown === 'theme' && (
                                <div className={MENU} role="menu">
                                    {themeOptions.map(({ id, labelId, defaultLabel, Icon }) => (
                                        <MenuItem
                                            key={id}
                                            selected={theme === id}
                                            onClick={() => {
                                                setTheme(id);
                                                setOpenDropdown(null);
                                            }}
                                        >
                                            <Icon className="h-4 w-4 text-[var(--accent)]" />
                                            <span>
                                                {intl.formatMessage({
                                                    id: labelId,
                                                    defaultMessage: defaultLabel,
                                                })}
                                            </span>
                                        </MenuItem>
                                    ))}
                                </div>
                            )}
                        </div>

                        {loggedIn ? (
                            <button
                                type="button"
                                onClick={handleLogout}
                                aria-label={intl.formatMessage({
                                    id: 'nav.logout',
                                    defaultMessage: 'Logout',
                                })}
                                className={CONTROL}
                            >
                                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                            </button>
                        ) : (
                            <NavLink
                                to="/admin/login"
                                aria-label={intl.formatMessage({
                                    id: 'nav.admin',
                                    defaultMessage: 'Admin',
                                })}
                                className={CONTROL}
                            >
                                <LockClosedIcon className="h-4 w-4" />
                            </NavLink>
                        )}
                    </div>
                </nav>
            </header>

            {/* The only scroll container in the app. Top padding clears the floating
                bar; the bottom bar is a sibling, so it needs no padding of its own. */}
            <main
                ref={scrollRef}
                className="app-scroll relative z-10 flex-1 overflow-y-auto px-4 pb-12 pt-24 sm:px-6 sm:pt-28"
            >
                <Outlet />
            </main>

            {/* Anchored bottom bar: a row of the shell, not a fixed overlay, so it can
                never cover content the way `position: fixed` would. */}
            <footer className="relative z-20 shrink-0 border-t border-[var(--line)] bg-[var(--glass)] px-4 backdrop-blur-xl sm:px-6">
                <div className="max-w-8xl mx-auto flex h-14 items-center justify-between gap-4 text-xs">
                    <span className="flex shrink-0 flex-col leading-tight text-[var(--muted)]">
                        <span>
                            <span className="font-mono">© 2026</span>{' '}
                            <span className="hidden sm:inline">Woofi-Developments</span>
                        </span>
                        <span className="hidden sm:inline">
                            <FormattedMessage
                                id="footer.rightsReserved"
                                defaultMessage="All Rights Reserved."
                            />
                        </span>
                    </span>

                    <div className="hidden md:block">
                        {buildInfo && <BuildInfo info={buildInfo} />}
                    </div>

                    <ul className="flex shrink-0 items-center gap-4 font-medium text-[var(--muted)]">
                        <li>
                            {/* Status lives on its own `status.` subdomain, not an in-app route.
                                `window.location` (not the `location` var above, which is react-router's
                                useLocation() and shadows the global — it has no protocol/host). Drop
                                any subdomain (www, etc.) so this resolves the same from every host. */}
                            <a
                                href={statusUrl()}
                                className="inline-flex items-center gap-1.5 transition hover:text-[var(--text)]"
                            >
                                <span className="animate-live h-1.5 w-1.5 rounded-full bg-[var(--live)]" />
                                <FormattedMessage id="footer.status" defaultMessage="Status" />
                            </a>
                        </li>
                        <li>
                            <NavLink
                                to="/privacy-policy"
                                className="transition hover:text-[var(--text)]"
                            >
                                <FormattedMessage
                                    id="footer.privacyPolicy"
                                    defaultMessage="Privacy Policy"
                                />
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/contact" className="transition hover:text-[var(--text)]">
                                <FormattedMessage id="footer.contact" defaultMessage="Contact" />
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </footer>
        </div>
    );
}

// Shared row for both dropdowns — same shape, same selected treatment.
function MenuItem({ selected, onClick, children }) {
    return (
        <button
            type="button"
            role="menuitem"
            onClick={onClick}
            className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                selected
                    ? 'bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--text)]'
                    : 'text-[var(--muted)] hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] hover:text-[var(--text)]'
            }`}
        >
            {children}
        </button>
    );
}

// Builds the status page URL for whatever host we're currently on — dropping any
// subdomain (www, status, ...) so it always resolves to `status.<base-domain>`.
function statusUrl() {
    const { protocol, hostname, port } = window.location;
    const baseHost = hostname.split('.').slice(-2).join('.');
    return `${protocol}//status.${baseHost}${port ? `:${port}` : ''}`;
}

// Derives the "owner/repo" slug from a repository URL (e.g. a GitHub source URL).
function repoSlug(url) {
    if (!url) return '';
    try {
        return new URL(url).pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '');
    } catch {
        return '';
    }
}

// Renders the deployed build's repository + version (fed by /api/info) for the footer center.
function BuildInfo({ info }) {
    const slug = repoSlug(info.repositoryUrl);
    const label = slug || 'local';
    const tooltip = [
        info.revision && `revision ${info.revision}`,
        info.buildDate && `built ${info.buildDate}`,
    ]
        .filter(Boolean)
        .join(' · ');

    const chip = (
        <span
            title={tooltip || undefined}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 font-mono text-2xs text-[var(--muted)]"
        >
            <CodeBracketIcon className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span className="text-[var(--text)]">{label}</span>
            <span className="text-[var(--line)]">·</span>
            <span>{info.version}</span>
        </span>
    );

    if (!info.repositoryUrl) return chip;

    return (
        <a
            href={info.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition hover:opacity-80"
        >
            {chip}
        </a>
    );
}
