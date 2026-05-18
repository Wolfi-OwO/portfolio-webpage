import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';

const themeOptions = [
    { id: 'light', label: 'Light', Icon: SunIcon },
    { id: 'dark', label: 'Dark', Icon: MoonIcon },
    { id: 'system', label: 'Browser', Icon: ComputerDesktopIcon },
];

export default function DefaultLayout() {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = () => {
            if (theme === 'dark') {
                root.classList.add('dark');
            } else if (theme === 'light') {
                root.classList.remove('dark');
            } else {
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (systemDark) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
            }
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
        <div className="min-h-screen bg-white text-gray-900 transition-colors duration-300 dark:bg-gray-950 dark:text-white">
            <header className="border-b border-gray-200 dark:border-gray-800">
                <nav className="mx-auto flex h-16 max-w-8xl items-center justify-between px-3">
                    <div className="flex items-center gap-4">
                        <NavLink to="/" className="text-xl font-semibold tracking-tight">
                            Woofi-Developments
                        </NavLink>

                        <NavLink
                            to="/projects"
                            className={({ isActive }) =>
                                `rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-gray-50 hover:text-slate-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white ${
                                    isActive ? 'bg-gray-100 text-slate-900 dark:bg-gray-800 dark:text-white' : ''
                                }`
                            }
                        >
                            Projects
                        </NavLink>
                    </div>

                    <div className="relative">
                        <details className="group">
                            <summary className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-gray-200/50 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-slate-950 dark:text-gray-200 dark:hover:bg-gray-800">
                                {selectedTheme?.Icon && <selectedTheme.Icon className="h-5 w-5" />}
                                <span>Theme</span>
                            </summary>

                            <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                {themeOptions.map(({ id, label, Icon }) => {
                                    const selected = theme === id;
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            onClick={() => setTheme(id)}
                                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
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
                        </details>
                    </div>
                </nav>
            </header>

            <main className="mx-auto min-h-[calc(100vh-65px)] max-w-8xl px-4 py-6">
                <Outlet />
            </main>

            <footer className="bg-neutral-primary-soft rounded-base shadow-xs border border-gray-200 dark:border-gray-800">
                <div className="w-full mx-auto max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
                    <span className="text-sm text-body sm:text-center">
                        © 2026{' '}
                        <a href="#" className="hover:underline">
                            Woofi-Developtments
                        </a>
                        . All Rights Reserved.
                    </span>
                    <ul className="flex flex-wrap items-center mt-3 text-sm font-medium text-body sm:mt-0">
                        <li>
                            <NavLink to="/" className="hover:underline me-4 md:me-6">
                                About
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/privacy-policy" className="hover:underline me-4 md:me-6">
                                Privacy Policy
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/contact" className="font-semibold tracking-tight hover:underline">
                                Contact
                            </NavLink>
                        </li>
                    </ul>
                </div>
            </footer>
        </div>
    );
}
