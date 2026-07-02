import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowRightOnRectangleIcon,
    CodeBracketIcon,
    ComputerDesktopIcon,
    LockClosedIcon,
    MoonIcon,
    SunIcon,
} from '@heroicons/react/24/outline';
import { isAdmin, logout } from '../../utils/auth.js';

const themeOptions = [
    { id: 'light', label: 'Light', Icon: SunIcon },
    { id: 'dark', label: 'Dark', Icon: MoonIcon },
    { id: 'system', label: 'Browser', Icon: ComputerDesktopIcon },
];

export default function DefaultLayout() {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'system';
    });
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [buildInfo, setBuildInfo] = useState(null);
    const [loggedIn, setLoggedIn] = useState(() => isAdmin());
    const dropdownRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        (() => {
            setLoggedIn(isAdmin());
        })();
    }, [location.pathname]);

    async function handleLogout() {
        await logout();
        setLoggedIn(false);
        navigate('/');
    }

    useEffect(() => {
        let active = true;

        fetch('/api/info')
            .then(res => (res.ok ? res.json() : null))
            .then(info => {
                if (active && info) setBuildInfo(info);
            })
            .catch(() => {
                // build info is non-critical: stay silent if the endpoint is unreachable
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = event => {
            if (
                dropdownOpen &&
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setDropdownOpen(false);
            }
        };

        const handleEscape = event => {
            if (event.key === 'Escape') {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [dropdownOpen]);

    useLayoutEffect(() => {
        const root = document.documentElement;

        const applyTheme = () => {
            const systemDark = window.matchMedia(
                '(prefers-color-scheme: dark)',
            ).matches;

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

    const selectedTheme = themeOptions.find(option => option.id === theme);

    return (
        <div className="min-h-screen flex flex-col bg-white text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
            <header className="border-b border-gray-200 dark:border-gray-800">
                <nav className="mx-auto flex h-16 max-w-8xl items-center justify-between px-3">
                    <div className="flex items-center gap-4">
                        <NavLink
                            to="/"
                            className="text-xl font-semibold tracking-tight"
                        >
                            Woofi-Developments
                        </NavLink>

                        <NavLink
                            to="/projects"
                            className={({ isActive }) =>
                                `rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-gray-50 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white ${
                                    isActive
                                        ? 'bg-gray-100 text-slate-900 dark:bg-gray-800 dark:text-white'
                                        : ''
                                }`
                            }
                        >
                            Projects
                        </NavLink>

                        {loggedIn ? (
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-gray-50 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white"
                            >
                                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                <span>Logout</span>
                            </button>
                        ) : (
                            <NavLink
                                to="/admin/login"
                                className={({ isActive }) =>
                                    `inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-gray-50 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white ${
                                        isActive
                                            ? 'bg-gray-100 text-slate-900 dark:bg-gray-800 dark:text-white'
                                            : ''
                                    }`
                                }
                            >
                                <LockClosedIcon className="h-4 w-4" />
                                <span>Admin</span>
                            </NavLink>
                        )}
                    </div>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setDropdownOpen(open => !open)}
                            className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-gray-200/50 transition hover:bg-gray-50 focus:outline-none focus:ring-0 dark:border-gray-700 dark:bg-slate-950 dark:text-gray-200 dark:hover:bg-gray-800"
                        >
                            {selectedTheme?.Icon && (
                                <selectedTheme.Icon className="h-5 w-5" />
                            )}
                            <span>Theme</span>
                        </button>

                        {dropdownOpen && (
                            <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                {themeOptions.map(({ id, label, Icon }) => {
                                    const selected = theme === id;
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => {
                                                setTheme(id);
                                                setDropdownOpen(false);
                                            }}
                                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-gray-50 focus:outline-none focus:ring-0 dark:hover:bg-gray-800 ${
                                                selected
                                                    ? 'bg-gray-100 text-slate-900 dark:bg-gray-800 dark:text-white'
                                                    : 'text-gray-600 dark:text-gray-300'
                                            }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span>{label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </nav>
            </header>

            <main className="w-full flex-1 mx-auto max-w-8xl px-4 py-6">
                <Outlet />
            </main>

            <footer className="bg-neutral-primary-soft rounded-base shadow-xs border border-gray-200 dark:border-gray-800">
                <div className="w-full mx-auto px-10 py-5 gap-3 md:grid md:grid-cols-3 md:items-center">
                    <span className="text-sm text-body sm:text-center md:text-left">
                        © 2026{' '}
                        <a href="#" className="hover:underline">
                            Woofi-Developtments
                        </a>
                        . All Rights Reserved.
                    </span>

                    <div className="mt-3 flex justify-center md:mt-0">
                        {buildInfo && <BuildInfo info={buildInfo} />}
                    </div>

                    <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-body sm:mt-0 md:justify-end">
                        <li>
                            <NavLink to="/" className="hover:underline me-4 md:me-6">
                                About
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/privacy-policy"
                                className="hover:underline me-4 md:me-6"
                            >
                                Privacy Policy
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to="/contact"
                                className="font-semibold tracking-tight hover:underline"
                            >
                                Contact
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </footer>
        </div>
    );
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
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
        >
            <CodeBracketIcon className="h-3.5 w-3.5" />
            <span className="font-medium text-gray-700 dark:text-gray-200">
                {label}
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
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
