import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import deMessages from './messages/de.js';
import { DEFAULT_LOCALE, LOCALES, localeFromPath, stripLocale, withLocale } from './locale-path.js';

const SUPPORTED_LOCALES = LOCALES;

const messagesByLocale = {
    en: {},
    de: deMessages,
};

const STORAGE_KEY = 'locale';
const LocaleContext = createContext(null);

// For the status page, which is its own bundle on its own subdomain with no router and
// so no address to read the language from. It follows the choice last made on the site.
function LocaleProvider({ children }) {
    const [locale] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
        } catch {
            return DEFAULT_LOCALE;
        }
    });
    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);
    const value = useMemo(
        () => ({ locale, setLocale: () => {}, supportedLocales: SUPPORTED_LOCALES }),
        [locale],
    );
    return (
        <LocaleContext.Provider value={value}>
            <IntlProvider
                locale={locale}
                defaultLocale={DEFAULT_LOCALE}
                messages={messagesByLocale[locale]}
            >
                {children}
            </IntlProvider>
        </LocaleContext.Provider>
    );
}

// The language comes from the address (/de/... or not), never from storage, so a crawler and a
// visitor opening the same URL get the same language. Rendered as a route element so it can
// read the location; every page below it, and the error page, sit inside the IntlProvider.
function LocaleShell() {
    const { pathname, search, hash } = useLocation();
    const navigate = useNavigate();
    const locale = localeFromPath(pathname);

    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    const value = useMemo(
        () => ({
            locale,
            // Switching language opens the same page in the other language.
            setLocale: (next) => {
                if (!SUPPORTED_LOCALES.includes(next) || next === locale) return;
                // The standalone status page has no router and reads the language from here.
                try {
                    localStorage.setItem(STORAGE_KEY, next);
                } catch {
                    // storage can be blocked; the address still carries the language
                }
                navigate(`${withLocale(stripLocale(pathname), next)}${search}${hash}`);
            },
            supportedLocales: SUPPORTED_LOCALES,
        }),
        [locale, pathname, search, hash, navigate],
    );

    return (
        <LocaleContext.Provider value={value}>
            <IntlProvider
                locale={locale}
                defaultLocale={DEFAULT_LOCALE}
                messages={messagesByLocale[locale]}
            >
                <Outlet />
            </IntlProvider>
        </LocaleContext.Provider>
    );
}

function useLocale() {
    const ctx = useContext(LocaleContext);
    if (!ctx) {
        throw new Error('useLocale must be used within the LocaleShell route');
    }
    return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook + its constant belong together
export { LocaleShell, LocaleProvider, useLocale, SUPPORTED_LOCALES };
