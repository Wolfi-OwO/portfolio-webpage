import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';
import deMessages from './messages/de.js';

const SUPPORTED_LOCALES = ['en', 'de'];
const DEFAULT_LOCALE = 'en';
const STORAGE_KEY = 'locale';

const messagesByLocale = {
    en: {},
    de: deMessages,
};

const LocaleContext = createContext(null);

function LocaleProvider({ children }) {
    const [locale, setLocaleState] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, locale);
        document.documentElement.lang = locale;
    }, [locale]);

    function setLocale(next) {
        if (SUPPORTED_LOCALES.includes(next)) {
            setLocaleState(next);
        }
    }

    const value = useMemo(() => ({ locale, setLocale, supportedLocales: SUPPORTED_LOCALES }), [locale]);

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

function useLocale() {
    const ctx = useContext(LocaleContext);
    if (!ctx) {
        throw new Error('useLocale must be used within a LocaleProvider');
    }
    return ctx;
}

export { LocaleProvider, useLocale, SUPPORTED_LOCALES };
