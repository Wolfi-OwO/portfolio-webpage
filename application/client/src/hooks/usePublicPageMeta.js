import { useIntl } from 'react-intl';
import { META } from '../../../server/src/seo/pages.js';
import { usePageMeta } from './usePageMeta.js';

// The title and description of a public page, in the language of the address. They come from the same file the
// server uses to fill the HTML it sends, so the text a crawler reads first and the text the app sets once it
// runs cannot differ. Change a title in server/src/seo/pages.js, nowhere else.
export function usePublicPageMeta(route) {
    const { locale } = useIntl();
    const { title, description } = META[route][locale];
    usePageMeta(title, description);
}
