import { useEffect } from 'react';

// Second line of defence behind the X-Robots-Tag header the server sends for these paths: if a proxy ever strips
// the header, the page still tells crawlers not to index it. Removed again on leaving so a public route reached
// afterwards by client-side navigation is not marked noindex.
export function useNoIndex() {
    useEffect(() => {
        const meta = document.createElement('meta');
        meta.name = 'robots';
        meta.content = 'noindex, nofollow, noarchive';
        document.head.appendChild(meta);
        return () => meta.remove();
    }, []);
}
