import { InternalServerError } from '../middlewares/error-handlers.js';
import { logger } from '../utils/logger.js';

// The Data API has no watch history or play counts, so "On repeat" is built from the Liked Music playlist ("LM", only the songs, no Shorts), read with the owner's
// refresh token. Quota: a page of playlistItems costs 1 unit of 10 000 per day, so 4 pages every 30 minutes is negligible; the cache exists
// to keep the public endpoint from forwarding each visit to Google.
const CACHE_MS = 30 * 60 * 1000;
const PAGE_SIZE = 50;
const MAX_PAGES = 4;
let cache = null; // { at, promise }

const configured = () =>
    ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET', 'YOUTUBE_REFRESH_TOKEN'].every(
        (k) => process.env[k],
    );

async function accessToken() {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: process.env.YOUTUBE_CLIENT_ID,
            client_secret: process.env.YOUTUBE_CLIENT_SECRET,
            refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
            grant_type: 'refresh_token',
        }),
        signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`token refresh answered ${res.status}`);
    return (await res.json()).access_token;
}

async function likedItems(token) {
    const items = [];
    let pageToken = '';
    for (let page = 0; page < MAX_PAGES; page++) {
        const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
        url.search = new URLSearchParams({
            part: 'snippet',
            playlistId: 'LM',
            maxResults: String(PAGE_SIZE),
            ...(pageToken && { pageToken }),
        });
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`playlistItems answered ${res.status}`);
        const body = await res.json();
        items.push(...body.items);
        pageToken = body.nextPageToken;
        if (!pageToken) break;
    }
    return items;
}

// YouTube Music uploads carry the artist as "<Artist> - Topic"; label channels end in VEVO ("ImagineDragonsVEVO"); plain uploads carry the channel name.
const artistOf = (s) =>
    (s.videoOwnerChannelTitle || '').replace(/ - Topic$/, '').replace(/VEVO$/, '');

export function buildReport(items, now = new Date()) {
    const tracks = items
        .filter((i) => i.snippet?.resourceId?.videoId && i.snippet.title !== 'Deleted video')
        .map((i) => ({
            t: i.snippet.title,
            a: artistOf(i.snippet),
            vid: i.snippet.resourceId.videoId,
            at: i.snippet.publishedAt,
        }));
    const byArtist = new Map();
    for (const t of tracks) if (t.a) byArtist.set(t.a, (byArtist.get(t.a) || 0) + 1);
    const artists = [...byArtist]
        .map(([name, n]) => ({ name, n }))
        .sort((x, y) => y.n - x.n || x.name.localeCompare(y.name))
        .slice(0, 5);
    // Likes per calendar month for the last six months, oldest first, zero months included so the chart has no gaps.
    const months = Array.from({ length: 6 }, (_, k) => {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - k), 1));
        return { key: d.toISOString().slice(0, 7), n: 0 };
    });
    for (const t of tracks) {
        const m = months.find((x) => x.key === (t.at || '').slice(0, 7));
        if (m) m.n++;
    }
    return {
        source: 'youtube',
        total: tracks.length,
        artistCount: byArtist.size,
        artists,
        months,
        items: tracks.slice(0, 5),
    };
}

function cachedReport() {
    if (cache && Date.now() - cache.at < CACHE_MS) return cache.promise;
    const promise = accessToken()
        .then(likedItems)
        .then((items) => buildReport(items));
    cache = { at: Date.now(), promise };
    // a failed fetch is evicted so the next visit retries instead of serving the error for 30 minutes
    promise.catch(() => {
        if (cache?.promise === promise) cache = null;
    });
    return promise;
}

export async function getMusic(req, res, next) {
    // 204 is the "not connected" answer: the client keeps its built-in snapshot and the console stays free of errors.
    if (!configured()) return res.status(204).end();
    try {
        res.json(await cachedReport());
    } catch (err) {
        logger.error(`Music - ${err.message}`);
        next(new InternalServerError(err));
    }
}
