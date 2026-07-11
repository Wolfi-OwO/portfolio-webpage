/* ***************** IMPORT packages *********************** */
import { BadRequest, InternalServerError } from '../middlewares/error-handlers.js';
import { ContributionDayModel, ForgeRepoModel, SyncStateModel } from '../models/contribution.js';

/* ***************** CONFIG and CONSTS ********************* */
/* The handles are only needed to build profile links — no request ever calls a
 * forge. The numbers come from the database, filled by the `syncContributions`
 * timer in the monitor-checker Function App. */
const GITHUB_USER = process.env.GITHUB_USER || 'Wolfi-OwO';
const GITLAB_HOST = (process.env.GITLAB_HOST || 'https://gitlab.com').replace(/\/$/, '');
const GITLAB_USER = process.env.GITLAB_USER || 'Koflerp';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WINDOW_DAYS = 365;
// The heatmap pages through history one window at a time; a request for a decade
// at once would be a mistake, not a feature.
const MAX_WINDOW_DAYS = 732;

/* ***************** HELPERS ******************************* */

/** yyyy-mm-dd in UTC — the key every day bucket is stored under. */
function dayKey(date) {
    return new Date(date).toISOString().slice(0, 10);
}

/** Midnight UTC, so day boundaries never drift with the server's timezone. */
function startOfDay(date) {
    const copy = new Date(date);
    copy.setUTCHours(0, 0, 0, 0);
    return copy;
}

/** Reads ?from= / ?to=, defaulting to the last year. */
function parseWindow(query) {
    const to = query.to ? startOfDay(new Date(query.to)) : startOfDay(new Date());

    if (Number.isNaN(to.getTime())) {
        throw new BadRequest('Invalid `to` date.');
    }

    const from = query.from
        ? startOfDay(new Date(query.from))
        : startOfDay(new Date(to.getTime() - (DEFAULT_WINDOW_DAYS - 1) * DAY_MS));

    if (Number.isNaN(from.getTime())) {
        throw new BadRequest('Invalid `from` date.');
    }

    if (from > to) {
        throw new BadRequest('`from` must not be after `to`.');
    }

    const days = Math.round((to - from) / DAY_MS) + 1;

    if (days > MAX_WINDOW_DAYS) {
        throw new BadRequest(
            `Window too large: ${days} days (max ${MAX_WINDOW_DAYS}). Page through it instead.`,
        );
    }

    return { from, to, days };
}

/**
 * Folds the stored rows into one count per day and source.
 *
 * The calendar rows and the per-repository commit rows describe overlapping
 * facts: inside GitLab's rolling year the calendar already counts those commits
 * (plus issues, merge requests and comments), while outside it only the commits
 * exist. Summing them would inflate every recent day, so the larger of the two
 * wins — the calendar inside its window, the commits beyond it.
 */
function fold(rows) {
    const byDate = new Map();

    for (const row of rows) {
        const entry = byDate.get(row.date) || { calendar: 0, commits: 0 };

        if (row.scope === 'calendar') {
            entry.calendar = Math.max(entry.calendar, row.count);
        } else {
            entry.commits += row.count;
        }

        byDate.set(row.date, entry);
    }

    const days = {};

    for (const [date, entry] of byDate) {
        const count = Math.max(entry.calendar, entry.commits);
        if (count > 0) days[date] = count;
    }

    return days;
}

/* ***************** DECLARE handlers *********************** */

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns The combined GitHub + GitLab contribution calendar for one window,
 *          plus the repositories behind it — served straight from the database.
 */
async function getActivity(req, res, next) {
    try {
        const { from, to, days: dayCount } = parseWindow(req.query);

        const [rows, repoDocs, state] = await Promise.all([
            ContributionDayModel.find({
                date: { $gte: dayKey(from), $lte: dayKey(to) },
            }).lean(),
            ForgeRepoModel.find().sort({ lastActivity: -1 }).limit(8).lean(),
            SyncStateModel.findOne({ key: 'contributions' }).lean(),
        ]);

        const github = fold(rows.filter((row) => row.source === 'github'));
        const gitlab = fold(rows.filter((row) => row.source === 'gitlab'));

        const series = [];
        let githubTotal = 0;
        let gitlabTotal = 0;

        for (let i = 0; i < dayCount; i += 1) {
            const key = dayKey(new Date(from.getTime() + i * DAY_MS));

            const gh = github[key] || 0;
            const gl = gitlab[key] || 0;

            githubTotal += gh;
            gitlabTotal += gl;

            series.push({ date: key, github: gh, gitlab: gl, count: gh + gl });
        }

        const repos = repoDocs.map((repo) => ({
            name: repo.name,
            url: repo.url,
            host: repo.host,
            description: repo.description || '',
            language: repo.language || '',
            lastActivity: repo.lastActivity,
        }));

        // A source with no rows at all has never been synced — say so, instead of
        // letting an empty column read as "this person wrote no code".
        const synced = Boolean(state);
        const backfilling = Boolean(state && state.phase !== 'done');

        return res.json({
            from: dayKey(from),
            to: dayKey(to),
            days: series,
            repos,
            sources: {
                github: {
                    ok: rows.some((row) => row.source === 'github'),
                    reason: synced ? null : 'not-synced',
                    total: githubTotal,
                    user: GITHUB_USER,
                    profileUrl: `https://github.com/${GITHUB_USER}`,
                },
                gitlab: {
                    ok: rows.some((row) => row.source === 'gitlab'),
                    reason: synced ? null : 'not-synced',
                    total: gitlabTotal,
                    user: GITLAB_USER,
                    profileUrl: `${GITLAB_HOST}/${GITLAB_USER}`,
                },
            },
            total: githubTotal + gitlabTotal,
            // Lets the page say "still catching up" rather than silently showing a
            // half-filled graph while the backfill is still walking the history.
            backfilling,
            syncedAt: state?.lastRunAt || null,
        });
    } catch (err) {
        if (err instanceof BadRequest) {
            return next(err);
        }
        return next(new InternalServerError(err));
    }
}

export { getActivity };
