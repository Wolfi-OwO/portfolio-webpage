import { forwardRef } from 'react';
import {
    Link as RouterLink,
    NavLink as RouterNavLink,
    useNavigate as useRouterNavigate,
} from 'react-router-dom';
import { useLocale } from './LocaleContext.jsx';
import { localizeTo } from './locale-path.js';

// Drop-in replacements for the react-router versions that keep a visitor inside the
// language they are reading: on /de/career, a link to "/services" goes to /de/services.
export const Link = forwardRef(function Link({ to, ...rest }, ref) {
    const { locale } = useLocale();
    return <RouterLink ref={ref} to={localizeTo(to, locale)} {...rest} />;
});

export const NavLink = forwardRef(function NavLink({ to, end, ...rest }, ref) {
    const { locale } = useLocale();
    const target = localizeTo(to, locale);
    // "/" and "/de" are the home pages and must not stay "active" on every sub-page.
    return <RouterNavLink ref={ref} to={target} end={end ?? (to === '/' || undefined)} {...rest} />;
});

// eslint-disable-next-line react-refresh/only-export-components -- the link wrappers and their navigate hook belong together
export function useNavigate() {
    const navigate = useRouterNavigate();
    const { locale } = useLocale();
    return (to, options) =>
        typeof to === 'string' ? navigate(localizeTo(to, locale), options) : navigate(to, options);
}
