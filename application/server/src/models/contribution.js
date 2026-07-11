import mongoose from 'mongoose';

/**
 * One day's contribution count, as written by the monitor-checker Function App's
 * `syncContributions` job. The server only ever reads these — nothing here talks
 * to GitHub or GitLab during a request.
 *
 * `scope` separates a forge's own contribution calendar ('calendar') from the
 * commits of an individual repository (its id). They are stored side by side
 * rather than summed, because they overlap: GitLab's calendar already counts
 * commits, so adding both would double every recent day. The read path takes the
 * larger of the two instead.
 *
 * Kept in sync by hand with monitor-checker/src/functions/syncContributions.js —
 * the two deploy independently.
 */
const contributionDaySchema = new mongoose.Schema(
    {
        source: { type: String, required: true, index: true },
        scope: { type: String, required: true },
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
        phase: { type: String, default: 'github-years' },
        githubYear: { type: Number },
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

export { ContributionDayModel, ForgeRepoModel, SyncStateModel };
