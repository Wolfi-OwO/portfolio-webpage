import { app } from '@azure/functions';
import mongoose from 'mongoose';

/**
 * Keeps the contribution heatmap's data in the database instead of fetching it
 * from the forges on every page view.
 *
 * Why a job at all: the live approach could never show the whole story. GitLab's
 * events feed truncates after a few hundred entries, its calendar.json only covers
 * a rolling twelve months, and private repositories (where the older work actually
 * lives) are invisible without a token. Walking every repository's commit history
 * takes far too long to do inside an HTTP request — but it is perfectly fine for a
 * background job that does a little of it each minute.
 *
 * The job therefore runs in two modes:
 *
 *   backfill    — once, in small chunks, until the entire history is in the DB.
 *                 Progress is written to SyncState after every chunk, so a cold
 *                 start (or a crash) resumes instead of starting over.
 *   incremental — from then on, only the recent window is refreshed each tick.
 *
 * Everything is idempotent: a day's count is *set*, never incremented, and each
 * (source, scope, date) triple is unique. Re-running a chunk cannot double-count.
 */

/* ── Schemas ──────────────────────────────────────────────────────────────────
   Mirrored in application/server/src/models/contribution.js — duplicated, not
   imported, because this Function App deploys independently of the backend. */

const contributionDaySchema = new mongoose.Schema(
    {
        // 'github' | 'gitlab'
        source: { type: String, required: true, index: true },
        // 'calendar' for a forge's own contribution calendar, otherwise the
        // repository id whose commits produced this count. Keeping them apart is
        // what makes re-syncing a single repository safe.
        scope: { type: String, required: true },
        // yyyy-mm-dd (UTC)
        date: { type: String, required: true, index: true },
        count: { type: Number, required: true },
    },
    { timestamps: true },
);

contributionDaySchema.index({ source: 1, scope: 1, date: 1 }, { unique: true });

const forgeRepoSchema = new mongoose.Schema(
    {
        host: { type: String, required: true },
        name: { type: String, required: true },
        url: { type: String, required: true },
        description: { type: String, default: '' },
        language: { type: String, default: '' },
        lastActivity: { type: Date },
    },
    { timestamps: true },
);

forgeRepoSchema.index({ host: 1, name: 1 }, { unique: true });

const syncStateSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true },
        // 'github-years' → 'gitlab-projects' → 'done'
        phase: { type: String, default: 'github-years' },
        // Year currently being backfilled on GitHub, walking backwards.
        githubYear: { type: Number },
        // Repository ids still to be walked on GitLab.
        gitlabQueue: { type: [Number], default: [] },
        lastRunAt: { type: Date },
        lastError: { type: String },
    },
    { timestamps: true },
);

const ContributionDayModel =
    mongoose.models.ContributionDay ?? mongoose.model('ContributionDay', contributionDaySchema);
const ForgeRepoModel = mongoose.models.ForgeRepo ?? mongoose.model('ForgeRepo', forgeRepoSchema);
const SyncStateModel = mongoose.models.SyncState ?? mongoose.model('SyncState', syncStateSchema);

/* ── Config ─────────────────────────────────────────────────────────────────── */

const GITHUB_USER = process.env.GITHUB_USER || 'Wolfi-OwO';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

const GITLAB_HOST = (process.env.GITLAB_HOST || 'https://gitlab.com').replace(/\/$/, '');
const GITLAB_USER = process.env.GITLAB_USER || 'Koflerp';
const GITLAB_TOKEN = process.env.GITLAB_TOKEN || '';

// How far back the backfill is willing to look. GitHub accounts older than this
// simply stop contributing rows; there is no point walking to 1970.
const EARLIEST_YEAR = Number(process.env.CONTRIBUTIONS_EARLIEST_YEAR || 2018);

// Work done per tick. Small on purpose: a minute-ly job that does a little every
// time finishes the backfill within an hour and never risks the execution timeout
// (nor a meaningful share of the free grant).
const REPOS_PER_RUN = Number(process.env.CONTRIBUTIONS_REPOS_PER_RUN || 3);
// Incremental mode re-reads this many days each tick — enough to catch commits
// pushed with an older author date.
const REFRESH_DAYS = Number(process.env.CONTRIBUTIONS_REFRESH_DAYS || 21);

const REQUEST_TIMEOUT_MS = 15000;
const DAY_MS = 24 * 60 * 60 * 1000;

let connecting = null;
function ensureConnected() {
    if (mongoose.connection.readyState === 1) return Promise.resolve();
    if (!connecting) connecting = mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
    return connecting;
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function dayKey(value) {
    return new Date(value).toISOString().slice(0, 10);
}

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

/** Writes a day map for one (source, scope) — the unit of work everything shares. */
async function storeDays(source, scope, days) {
    const entries = Object.entries(days);
    if (!entries.length) return;

    await ContributionDayModel.bulkWrite(
        entries.map(([date, count]) => ({
            updateOne: {
                filter: { source, scope, date },
                update: { $set: { count } },
                upsert: true,
            },
        })),
        { ordered: false },
    );
}

async function storeRepos(repos) {
    if (!repos.length) return;

    await ForgeRepoModel.bulkWrite(
        repos.map((repo) => ({
            updateOne: {
                filter: { host: repo.host, name: repo.name },
                update: { $set: repo },
                upsert: true,
            },
        })),
        { ordered: false },
    );
}

/* ── GitHub ─────────────────────────────────────────────────────────────────── */

/**
 * GitHub's calendar is only reachable through GraphQL, which needs a token even
 * for public data — and it refuses spans longer than a year, hence one call per
 * year. That also makes it a natural backfill chunk.
 */
async function githubYear(year, context) {
    if (!GITHUB_TOKEN) return { days: {}, repos: [], empty: true };

    const from = new Date(Date.UTC(year, 0, 1)).toISOString();
    const to = new Date(Date.UTC(year, 11, 31, 23, 59, 59)).toISOString();

    const query = `
        query($login: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $login) {
                contributionsCollection(from: $from, to: $to) {
                    contributionCalendar {
                        weeks { contributionDays { date contributionCount } }
                    }
                }
                repositories(first: 8, orderBy: { field: PUSHED_AT, direction: DESC }, ownerAffiliations: OWNER) {
                    nodes { name url pushedAt description primaryLanguage { name } }
                }
            }
        }
    `;

    const res = await fetchWithTimeout('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'portfolio-webpage',
        },
        body: JSON.stringify({ query, variables: { login: GITHUB_USER, from, to } }),
    });

    if (!res.ok) throw new Error(`GitHub responded ${res.status}`);

    const body = await res.json();
    if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join('; '));

    const days = {};

    for (const week of body.data?.user?.contributionsCollection?.contributionCalendar?.weeks ||
        []) {
        for (const day of week.contributionDays) {
            if (day.contributionCount > 0) days[day.date] = day.contributionCount;
        }
    }

    const repos = (body.data?.user?.repositories?.nodes || []).map((repo) => ({
        host: 'github',
        name: repo.name,
        url: repo.url,
        description: repo.description || '',
        language: repo.primaryLanguage?.name || '',
        lastActivity: repo.pushedAt ? new Date(repo.pushedAt) : undefined,
    }));

    context.log(`Contributions - GitHub ${year}: ${Object.keys(days).length} active days`);

    return { days, repos, empty: Object.keys(days).length === 0 };
}

/* ── GitLab ─────────────────────────────────────────────────────────────────── */

async function gitlabHeaders() {
    return {
        'User-Agent': 'portfolio-webpage',
        ...(GITLAB_TOKEN ? { 'PRIVATE-TOKEN': GITLAB_TOKEN } : {}),
    };
}

async function gitlabUser(headers) {
    const res = await fetchWithTimeout(
        `${GITLAB_HOST}/api/v4/users?username=${encodeURIComponent(GITLAB_USER)}`,
        { headers },
    );

    if (!res.ok) throw new Error(`GitLab responded ${res.status}`);

    const users = await res.json();
    return users[0] || null;
}

/** GitLab's own graph: accurate, but only a rolling twelve months. */
async function gitlabCalendar(user, headers) {
    const res = await fetchWithTimeout(
        `${GITLAB_HOST}/users/${encodeURIComponent(user.username)}/calendar.json`,
        { headers },
    );

    if (!res.ok) return {};

    return res.json();
}

/**
 * Every project the account can see. With a token this includes the private ones —
 * which is the whole point: that is where the 2023 coursework lives.
 */
async function gitlabProjects(user, headers) {
    const byId = new Map();

    for (let page = 1; page <= 10; page += 1) {
        const url = GITLAB_TOKEN
            ? `${GITLAB_HOST}/api/v4/projects?membership=true&per_page=100&page=${page}&order_by=last_activity_at`
            : `${GITLAB_HOST}/api/v4/users/${encodeURIComponent(GITLAB_USER)}/projects?per_page=100&page=${page}`;

        const res = await fetchWithTimeout(url, { headers });
        if (!res.ok) break;

        const batch = await res.json();
        if (!Array.isArray(batch) || !batch.length) break;

        for (const project of batch) byId.set(project.id, project);
        if (batch.length < 100) break;
    }

    // Anonymously, /users/:id/projects hands back nothing at all — but the public
    // events feed names the projects it touched. Not a substitute for a token (it
    // can only ever reveal public work), just better than an empty list.
    if (!byId.size && user) {
        const ids = new Set();

        for (let page = 1; page <= 5; page += 1) {
            const res = await fetchWithTimeout(
                `${GITLAB_HOST}/api/v4/users/${user.id}/events?per_page=100&page=${page}`,
                { headers },
            );

            if (!res.ok) break;

            const events = await res.json();
            if (!Array.isArray(events) || !events.length) break;

            for (const event of events) {
                if (event.project_id) ids.add(event.project_id);
            }

            if (events.length < 100) break;
        }

        await Promise.all(
            [...ids].map(async (id) => {
                const res = await fetchWithTimeout(`${GITLAB_HOST}/api/v4/projects/${id}`, {
                    headers,
                });

                if (res.ok) {
                    const project = await res.json();
                    byId.set(project.id, project);
                }
            }),
        );
    }

    return [...byId.values()];
}

function isOwnCommit(commit, user) {
    const haystack = `${commit.author_name || ''} ${commit.author_email || ''}`.toLowerCase();

    return (
        haystack.includes((user.username || '').toLowerCase()) ||
        (Boolean(user.name) && haystack.includes(user.name.toLowerCase()))
    );
}

/**
 * Walks one repository's commits. `since` is left open during the backfill (the
 * full history) and set to the recent window afterwards.
 */
async function gitlabRepoCommits(projectId, user, headers, since) {
    const days = {};
    const sinceParam = since ? `&since=${since.toISOString()}` : '';

    for (let page = 1; page <= 20; page += 1) {
        const res = await fetchWithTimeout(
            `${GITLAB_HOST}/api/v4/projects/${projectId}/repository/commits` +
                `?per_page=100&page=${page}&all=true${sinceParam}`,
            { headers },
        );

        if (!res.ok) break;

        const commits = await res.json();
        if (!Array.isArray(commits) || !commits.length) break;

        for (const commit of commits) {
            if (!isOwnCommit(commit, user)) continue;

            const key = dayKey(commit.created_at || commit.committed_date);
            days[key] = (days[key] || 0) + 1;
        }

        if (commits.length < 100) break;
    }

    return days;
}

/* ── The tick ───────────────────────────────────────────────────────────────── */

async function runSyncCycle(context) {
    await ensureConnected();

    const state =
        (await SyncStateModel.findOne({ key: 'contributions' })) ||
        (await SyncStateModel.create({
            key: 'contributions',
            phase: 'github-years',
            githubYear: new Date().getUTCFullYear(),
        }));

    const headers = await gitlabHeaders();

    try {
        if (state.phase === 'github-years') {
            // One year per tick, walking backwards until a year comes back empty or
            // we reach the floor. Chunked so a tick stays short and resumable.
            const year = state.githubYear ?? new Date().getUTCFullYear();
            const { days, repos, empty } = await githubYear(year, context);

            await storeDays('github', 'calendar', days);
            await storeRepos(repos);

            const done = empty || year <= EARLIEST_YEAR;

            if (done) {
                const user = await gitlabUser(headers);
                const projects = user ? await gitlabProjects(user, headers) : [];

                state.phase = 'gitlab-projects';
                state.gitlabQueue = projects.map((p) => p.id);

                await storeRepos(
                    projects.slice(0, 20).map((project) => ({
                        host: 'gitlab',
                        name: project.path,
                        url: project.web_url,
                        description: project.description || '',
                        language: '',
                        lastActivity: project.last_activity_at
                            ? new Date(project.last_activity_at)
                            : undefined,
                    })),
                );

                context.log(
                    `Contributions - GitHub backfill done, queued ${projects.length} GitLab projects`,
                );
            } else {
                state.githubYear = year - 1;
            }
        } else if (state.phase === 'gitlab-projects') {
            const user = await gitlabUser(headers);

            if (!user) throw new Error('GitLab user not found');

            const batch = state.gitlabQueue.slice(0, REPOS_PER_RUN);

            for (const projectId of batch) {
                // No `since`: the backfill wants everything this repository ever saw.
                const days = await gitlabRepoCommits(projectId, user, headers, null);
                await storeDays('gitlab', String(projectId), days);
            }

            state.gitlabQueue = state.gitlabQueue.slice(batch.length);

            context.log(
                `Contributions - backfilled ${batch.length} GitLab repos, ${state.gitlabQueue.length} left`,
            );

            if (!state.gitlabQueue.length) {
                state.phase = 'done';
                context.log('Contributions - backfill complete, switching to incremental');
            }
        } else {
            // Incremental: the recent window only. Cheap enough to run every minute.
            const since = new Date(Date.now() - REFRESH_DAYS * DAY_MS);
            const thisYear = new Date().getUTCFullYear();

            const { days, repos } = await githubYear(thisYear, context);
            await storeDays('github', 'calendar', days);
            await storeRepos(repos);

            const user = await gitlabUser(headers);

            if (user) {
                const calendar = await gitlabCalendar(user, headers);
                await storeDays('gitlab', 'calendar', calendar);

                // Only the repositories that actually moved recently — walking all
                // of them every minute would be pointless work.
                const projects = await gitlabProjects(user, headers);
                const recent = projects
                    .filter((p) => !p.last_activity_at || new Date(p.last_activity_at) >= since)
                    .slice(0, REPOS_PER_RUN);

                for (const project of recent) {
                    const commitDays = await gitlabRepoCommits(project.id, user, headers, since);

                    // Merge, don't replace: `since` only returns the tail of this
                    // repository's history, so the older rows must survive.
                    const existing = await ContributionDayModel.find({
                        source: 'gitlab',
                        scope: String(project.id),
                        date: { $gte: dayKey(since) },
                    });

                    const merged = { ...commitDays };
                    for (const row of existing) {
                        if (!(row.date in merged)) merged[row.date] = 0;
                    }

                    await storeDays('gitlab', String(project.id), merged);
                }

                await storeRepos(
                    projects.slice(0, 20).map((project) => ({
                        host: 'gitlab',
                        name: project.path,
                        url: project.web_url,
                        description: project.description || '',
                        language: '',
                        lastActivity: project.last_activity_at
                            ? new Date(project.last_activity_at)
                            : undefined,
                    })),
                );
            }
        }

        state.lastRunAt = new Date();
        state.lastError = undefined;
        await state.save();
    } catch (err) {
        // A forge being down is not worth failing the invocation over — the next
        // tick is a minute away, and the state document keeps the progress.
        context.error(`Contributions - sync failed: ${err.message}`);

        state.lastError = err.message;
        state.lastRunAt = new Date();
        await state.save();
    }
}

app.timer('syncContributions', {
    schedule: process.env.CONTRIBUTIONS_CRON || '0 * * * * *',
    handler: async (_timer, context) => {
        await runSyncCycle(context);
    },
});

export { runSyncCycle, ContributionDayModel, ForgeRepoModel, SyncStateModel };
