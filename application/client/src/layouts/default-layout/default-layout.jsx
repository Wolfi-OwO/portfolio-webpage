import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import {
    ArrowRightOnRectangleIcon,
    Bars3Icon,
    CodeBracketIcon,
    ComputerDesktopIcon,
    HeartIcon,
    LanguageIcon,
    LockClosedIcon,
    MoonIcon,
    SunIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { isAdmin, logout } from '../../utils/auth.js';
import { useLocale, SUPPORTED_LOCALES } from '../../i18n/LocaleContext.jsx';
import { useSecretCombo } from '../../hooks/useSecretCombo.js';
import useSavedLook from '../../hooks/useSavedLook.js';
import '../../responsive.css';

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

// Header icon buttons: 44x44 minimum. The old shape was py-1.5 around a 16px icon
// and measured 28-38px tall on the live site (planner, 375px), under the 44px target
// size (WCAG 2.5.5 enhanced; 2.5.8 AA is 24px). Borderless on purpose: --line is
// only 1.23:1 against --bg, too faint to count as a control boundary (needs 3:1),
// while the muted icon itself is 4.87:1, so the icon carries the affordance and a
// tint shows hover and open state.
const CONTROL =
    'inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[var(--muted)] transition-colors duration-200 hover:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] aria-expanded:bg-[color-mix(in_srgb,var(--text)_6%,transparent)] aria-expanded:text-[var(--text)]';

// Popover: the one place a shadow stays, because it is the only element that sits
// above the page and has to read as a separate level.
const MENU =
    'absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 [box-shadow:var(--shadow-float)]';

// Footer links: 44px rows below lg (the old text-xs links were 17-18px tall in a
// 57px bar) and a colour-only hover. Opacity hovers are out: muted text is 5.95:1
// settled and falls under 4.5:1 at opacity .8.
const FOOTER_LINK =
    'inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg text-xs sm:text-sm lg:text-xs transition-colors duration-200 hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] lg:min-h-0';

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
    useSavedLook();
    // The phone menu remembers the path it was opened on, so navigating anywhere closes it without an effect.
    const [menuPath, setMenuPath] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null); // 'theme' | 'language' | null
    const [buildInfo, setBuildInfo] = useState(null);
    const [loggedIn, setLoggedIn] = useState(() => isAdmin());
    const [secretFound] = useSecretCombo();
    const themeDropdownRef = useRef(null);
    const languageDropdownRef = useRef(null);
    const scrollRef = useRef(null);
    const location = useLocation();
    const menuOpen = menuPath === location.pathname;
    const setMenuOpen = (open) => setMenuPath(open ? location.pathname : null);

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && setMenuPath(null);
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);
    const navigate = useNavigate();

    useEffect(() => {
        (() => {
            setLoggedIn(isAdmin());
        })();
    }, [location.pathname]);

    // One owner for scroll-to-top. Below lg the window scrolls (so iOS Safari can
    // collapse its toolbars and the footer stops costing 10% of a 568px screen:
    // 57px of 568 measured on the old fixed-bar shell); from lg up <main> scrolls.
    // lg rather than md because the stacked footer is 139-149px tall: pinned at 768
    // it would take 14.5% of a 1024px screen.
    // On a given width only one of the two moves, and resetting both is a no-op for
    // the other, so the same effect covers every width.
    useEffect(() => {
        window.scrollTo({ top: 0 });
        scrollRef.current?.scrollTo({ top: 0 });
        // Focus the scroll area so Space, PageDown and the arrow keys scroll it right after navigating.
        scrollRef.current?.focus({ preventScroll: true });
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

    // 44px high rows (the old py-1.5 links were about 32px). The active page gets a
    // 2px accent bar under the text instead of a tinted pill: it reads as a tab on
    // the hairline below, and colour is not the only cue (the bar is a shape).
    const navLinkClasses = ({ isActive }) =>
        `relative inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] md:px-3 ${
            isActive
                ? 'text-[var(--text)] after:absolute after:inset-x-2 after:bottom-1 after:h-0.5 after:rounded-full after:bg-[var(--accent)] md:after:inset-x-3'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
        }`;

    return (
        // Below lg the document scrolls and the shell is just a column (min-h-dvh,
        // footer pushed down by <main>'s flex-1). From lg up it keeps the
        // fixed-bar model: a viewport-tall column where only <main> scrolls.
        <div className="relative flex min-h-dvh flex-col bg-[var(--bg)] text-[var(--text)] transition-colors duration-300 lg:h-dvh lg:overflow-hidden">
            <div className="app-ground" aria-hidden="true" />

            {/* In-flow header, not a floating card: the old 56px rounded, blurred,
                shadowed bar plus its 8px gap covered content and measured 21px (375),
                36px (360) and 76px (320) of overlap between the link group and the
                language button. Now the links get their own row below md (grid row 2)
                and share the row with the controls from md up. The DOM order is
                wordmark, links, controls, so Tab reaches the links first. */}
            <header className="relative z-40 shrink-0 border-b border-[var(--line)] bg-[var(--bg)] pt-[env(safe-area-inset-top)]">
                <nav
                    aria-label={intl.formatMessage({
                        id: 'nav.main',
                        defaultMessage: 'Main navigation',
                    })}
                    className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-x-2 px-4 sm:px-6 md:grid-cols-[auto_1fr_auto] md:gap-x-4 lg:px-8"
                >
                    <div className="flex min-h-14 min-w-0 items-center">
                        <NavLink
                            to="/"
                            className="-ml-1 flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                        >
                            <img src="/favicon.svg" alt="" className="h-7 w-7 rounded-md" />
                            <span className="text-base font-extrabold tracking-tight">
                                Woofi
                                <span className="hidden text-[var(--muted)] sm:inline">
                                    -Developments
                                </span>
                            </span>
                        </NavLink>
                    </div>

                    {/* -mx-2 pulls the first link's text back onto the page margin;
                        the 8px side padding of each link is hit area, not visible
                        inset. flex-wrap lets the secret entry drop to a third line
                        instead of pushing the row wider than 288px at 320. */}
                    <div className="hidden flex-wrap items-center md:flex md:px-2">
                        <NavLink to="/projects" className={navLinkClasses}>
                            <FormattedMessage id="nav.projects" defaultMessage="Projects" />
                        </NavLink>

                        <NavLink to="/career" className={navLinkClasses}>
                            <FormattedMessage id="nav.career" defaultMessage="Career" />
                        </NavLink>

                        <NavLink to="/services" className={navLinkClasses}>
                            <FormattedMessage id="nav.services" defaultMessage="Services" />
                        </NavLink>

                        <NavLink to="/personal" className={navLinkClasses}>
                            <FormattedMessage id="nav.personal" defaultMessage="Personal" />
                        </NavLink>

                        {/* Only here once the combo has been typed. Fades in rather
                            than popping, so it reads as something appearing. */}
                        {secretFound && (
                            <NavLink
                                to="/secret"
                                className={(state) =>
                                    `${navLinkClasses(state)} animate-fade-up whitespace-nowrap`
                                }
                            >
                                <HeartIcon className="h-4 w-4 text-[#e5675b]" aria-hidden="true" />
                                <FormattedMessage
                                    id="nav.secret"
                                    defaultMessage="Another new Secret?!"
                                />
                            </NavLink>
                        )}
                    </div>

                    {/* Language, theme and admin share one owner for open state:
                        `openDropdown` holds at most one of them, and a single
                        outside-click and Escape handler closes it. There is no
                        'menu' value because the three links are always visible
                        (see above): 3 destinations do not need a hamburger. */}
                    <div className="-mr-2 hidden items-center gap-1 md:flex">
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
                                <LanguageIcon className="h-4 w-4" aria-hidden="true" />
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
                                {selectedTheme?.Icon && (
                                    <selectedTheme.Icon className="h-4 w-4" aria-hidden="true" />
                                )}
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
                                <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
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
                                <LockClosedIcon className="h-4 w-4" aria-hidden="true" />
                            </NavLink>
                        )}
                    </div>
                    <button
                        type="button"
                        aria-label={intl.formatMessage({ id: 'nav.menu', defaultMessage: 'Menu' })}
                        aria-expanded={menuOpen}
                        aria-controls="mobile-menu"
                        onClick={() => setMenuOpen(true)}
                        className={`${CONTROL} -mr-2 md:hidden`}
                    >
                        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    </button>
                </nav>
            </header>

            {/* Phone menu: slides in from the right. Below md the header only keeps the wordmark and this button. */}
            <div
                className={`fixed inset-0 z-50 md:hidden ${menuOpen ? '' : 'pointer-events-none'}`}
                aria-hidden={!menuOpen}
            >
                <div
                    onClick={() => setMenuOpen(false)}
                    className={`absolute inset-0 bg-black/55 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
                />
                <aside
                    id="mobile-menu"
                    className={`absolute right-0 top-0 flex h-dvh w-[min(20rem,86vw)] flex-col gap-6 overflow-y-auto border-l border-[var(--line)] bg-[var(--bg)] p-5 pt-[max(1.25rem,env(safe-area-inset-top))] transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="flex items-center justify-between">
                        <span className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                            Menu
                        </span>
                        <button
                            type="button"
                            aria-label={intl.formatMessage({
                                id: 'nav.menuClose',
                                defaultMessage: 'Close menu',
                            })}
                            onClick={() => setMenuOpen(false)}
                            className={CONTROL}
                        >
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                    </div>
                    <nav
                        className="flex flex-col"
                        aria-label={intl.formatMessage({
                            id: 'nav.main',
                            defaultMessage: 'Main navigation',
                        })}
                    >
                        {[
                            ['/projects', 'nav.projects', 'Projects'],
                            ['/career', 'nav.career', 'Career'],
                            ['/services', 'nav.services', 'Services'],
                            ['/personal', 'nav.personal', 'Personal'],
                            ['/contact', 'footer.contact', 'Contact'],
                        ].map(([to, id, label]) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `flex min-h-12 items-center border-b border-[var(--line)] text-lg font-bold ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text)]'}`
                                }
                            >
                                <FormattedMessage id={id} defaultMessage={label} />
                            </NavLink>
                        ))}
                        {secretFound && (
                            <NavLink
                                to="/secret"
                                className="flex min-h-12 items-center gap-2 border-b border-[var(--line)] text-lg font-bold text-[var(--text)]"
                            >
                                <HeartIcon className="h-5 w-5 text-[#e5675b]" aria-hidden="true" />
                                <FormattedMessage
                                    id="nav.secret"
                                    defaultMessage="Another new Secret?!"
                                />
                            </NavLink>
                        )}
                    </nav>
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="mb-2 font-mono text-2xs uppercase tracking-[0.18em] text-[var(--muted)]">
                                <FormattedMessage id="language.label" defaultMessage="Language" />
                            </p>
                            <div className="flex gap-2">
                                {SUPPORTED_LOCALES.map((code) => (
                                    <button
                                        key={code}
                                        type="button"
                                        onClick={() => setLocale(code)}
                                        aria-pressed={locale === code}
                                        className={`min-h-11 flex-1 rounded-lg border text-sm font-semibold ${locale === code ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--line)] text-[var(--muted)]'}`}
                                    >
                                        {languageOptions[code]?.short ?? code.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="mb-2 font-mono text-2xs uppercase tracking-[0.18em] text-[var(--muted)]">
                                <FormattedMessage id="theme.label" defaultMessage="Theme" />
                            </p>
                            <div className="flex gap-2">
                                {themeOptions.map(({ id, labelId, defaultLabel, Icon }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setTheme(id)}
                                        aria-pressed={theme === id}
                                        aria-label={intl.formatMessage({
                                            id: labelId,
                                            defaultMessage: defaultLabel,
                                        })}
                                        className={`flex min-h-11 flex-1 items-center justify-center rounded-lg border ${theme === id ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--line)] text-[var(--muted)]'}`}
                                    >
                                        <Icon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                ))}
                            </div>
                        </div>
                        {loggedIn ? (
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--line)] px-3 text-sm font-semibold text-[var(--muted)]"
                            >
                                <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
                                <FormattedMessage id="nav.logout" defaultMessage="Logout" />
                            </button>
                        ) : (
                            <NavLink
                                to="/admin/login"
                                className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--line)] px-3 text-sm font-semibold text-[var(--muted)]"
                            >
                                <LockClosedIcon className="h-5 w-5" aria-hidden="true" />
                                <FormattedMessage id="nav.admin" defaultMessage="Admin" />
                            </NavLink>
                        )}
                    </div>
                </aside>
            </div>

            {/* Below lg this is a plain flex child and the window scrolls; from lg up
                it is the only scroll container (lg). Top padding is now ordinary page
                spacing (the header is in flow), not the old 96px clearance. */}
            <main
                ref={scrollRef}
                tabIndex={-1}
                className="app-scroll relative z-10 flex-1 px-4 pb-16 pt-8 outline-none sm:px-6 md:pt-10 lg:overflow-y-auto lg:px-8"
            >
                <Outlet />
            </main>

            {/* One footer, breakpoint-scoped. Below lg: two columns of 44px link rows
                (status first), then a copyright row with the build pill from sm.
                From lg: the house single row, three zones (1fr auto 1fr). The
                three-zone grid starts at lg, not sm: at 640 the side cells are about
                195px for a link set that needs about 245px, and the links slid into
                the auto middle cell. In flow, never fixed; bottom padding clears the
                iOS home indicator. */}
            <footer className="relative z-20 shrink-0 border-t border-[var(--line)] bg-[var(--bg)] px-4 pb-[env(safe-area-inset-bottom)] sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-6xl grid-cols-2 items-center gap-x-4 pt-2 text-sm lg:h-14 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-4 lg:pt-0 lg:text-xs">
                    {/* Same size as the pill (house rule). nowrap because the old
                        copyright stacked "(c)" over "2026" at <=402px. */}
                    <p className="order-last col-span-2 flex flex-wrap items-center justify-center gap-x-2 justify-self-center py-2 text-center text-2xs text-[var(--muted)] sm:col-span-1 sm:justify-self-start sm:text-left sm:text-xs lg:order-none lg:col-span-1 lg:py-0">
                        <span className="whitespace-nowrap">
                            <span className="font-mono">© 2026</span> Woofi-Developments
                        </span>
                        <span className="hidden whitespace-nowrap sm:inline">
                            <FormattedMessage
                                id="footer.rightsReserved"
                                defaultMessage="All Rights Reserved."
                            />
                        </span>
                    </p>

                    <div className="order-last hidden justify-self-end py-3 sm:block lg:order-none lg:justify-self-center lg:py-0">
                        {buildInfo && <BuildInfo info={buildInfo} />}
                    </div>

                    <ul
                        aria-label={intl.formatMessage({
                            id: 'footer.nav',
                            defaultMessage: 'Legal and contact',
                        })}
                        className="order-first col-span-2 flex flex-wrap items-center justify-center gap-x-5 justify-self-stretch font-medium text-[var(--muted)] lg:order-none lg:col-span-1 lg:flex lg:items-center lg:gap-4 lg:justify-self-end"
                    >
                        <li>
                            {/* Status lives on its own `status.` subdomain, not an in-app route.
                                `window.location` (not the `location` var above, which is react-router's
                                useLocation() and shadows the global — it has no protocol/host). Drop
                                any subdomain (www, etc.) so this resolves the same from every host. */}
                            <a href={statusUrl()} className={FOOTER_LINK}>
                                <span className="animate-live h-1.5 w-1.5 rounded-full bg-[var(--live)]" />
                                <FormattedMessage id="footer.status" defaultMessage="Status" />
                            </a>
                        </li>
                        <li>
                            {/* Deliberately labelled "Impressum" in both locales — §5 ECG
                                asks for the imprint to be recognisable as such, and that
                                is the word an Austrian reader looks for. */}
                            <NavLink to="/impressum" className={FOOTER_LINK}>
                                <FormattedMessage id="footer.imprint" defaultMessage="Impressum" />
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/privacy-policy" className={FOOTER_LINK}>
                                <FormattedMessage
                                    id="footer.privacyPolicy"
                                    defaultMessage="Privacy Policy"
                                />
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/contact" className={FOOTER_LINK}>
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
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 font-mono text-xs text-[var(--muted)] transition-colors duration-200 group-hover:border-[var(--accent)]"
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
            className="group inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
            {chip}
        </a>
    );
}
