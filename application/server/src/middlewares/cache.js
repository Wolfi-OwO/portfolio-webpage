/**
 * Cache policy for the public read-only API.
 *
 * What the pages show here (projects, services, technologies, availability, activity, build info) changes a few times
 * a day at most, and every visitor asks for the same answer. A short `max-age` lets a navigation inside the site, or a
 * second visitor behind the same cache, skip the request; `stale-while-revalidate` lets the browser show the last answer
 * at once and refresh it in the background, so the page is never held back by a slow database.
 *
 * Only a GET without credentials gets the public policy. The admin pages call the same URLs with a bearer token and
 * must see their own edit straight away, so those answers are private and always revalidated. `Vary: Authorization`
 * keeps a shared cache from handing one kind of answer to the other.
 *
 * A handler that sets its own Cache-Control later (the status page does) overrides this.
 *
 * @param {number} maxAge - Seconds an answer is fresh.
 * @param {number} staleWhileRevalidate - Further seconds a stale answer may be shown while it is refreshed.
 */
export function publicCache(maxAge, staleWhileRevalidate) {
    const policy = `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
    return (req, res, next) => {
        if (req.method === 'GET' || req.method === 'HEAD') {
            res.vary('Authorization');
            res.set('Cache-Control', req.headers.authorization ? 'private, no-cache' : policy);
        }
        next();
    };
}
