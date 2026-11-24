/* ***************** IMPORT packages *********************** */
import assert from 'assert';
import { withBudget } from '../src/utils/with-budget.js';

/* ***************** DECLARE testfunctions *********************** */
const never = () => new Promise(() => {});

describe('withBudget', function () {
    it('returns the value when it arrives within the budget', async function () {
        const value = await withBudget(Promise.resolve('fresh'), 200, () => 'fallback');
        assert.equal(value, 'fresh');
    });

    it('falls back when the promise is slower than the budget', async function () {
        const reasons = [];
        const value = await withBudget(never(), 20, (reason) => {
            reasons.push(reason);
            return 'fallback';
        });
        assert.equal(value, 'fallback');
        assert.deepStrictEqual(reasons, ['slow']);
    });

    it('falls back when the promise rejects', async function () {
        const seen = [];
        const value = await withBudget(
            Promise.reject(new Error('db down')),
            200,
            (reason, error) => {
                seen.push([reason, error.message]);
                return 'fallback';
            },
        );
        assert.equal(value, 'fallback');
        assert.deepStrictEqual(seen, [['failed', 'db down']]);
    });

    it('keeps a promise that lost the race running', async function () {
        let finished = false;
        const slow = new Promise((resolve) =>
            setTimeout(() => {
                finished = true;
                resolve('late');
            }, 40),
        );
        assert.equal(await withBudget(slow, 5, () => 'fallback'), 'fallback');
        assert.equal(await slow, 'late');
        assert.ok(finished);
    });
});

describe('reportWithinBudget', function () {
    it('serves the last good report when the next build is too slow', async function () {
        const { reportWithinBudget, clearStatusCache, expireStatusCache } =
            await import('../src/handlers/status-handlers.js');
        clearStatusCache();
        const good = { status: 'operational', groups: [] };
        assert.strictEqual(
            await reportWithinBudget(false, null, { compute: async () => good }),
            good,
        );

        expireStatusCache();
        const served = await reportWithinBudget(false, null, { budgetMs: 20, compute: never });
        assert.strictEqual(served, good);
    });

    it('serves the last good report when the next build fails', async function () {
        const { reportWithinBudget, clearStatusCache, expireStatusCache } =
            await import('../src/handlers/status-handlers.js');
        clearStatusCache();
        const good = { status: 'operational', groups: [] };
        await reportWithinBudget(true, null, { compute: async () => good });

        expireStatusCache();
        const served = await reportWithinBudget(true, null, {
            compute: () => Promise.reject(new Error('database unreachable')),
        });
        assert.strictEqual(served, good);
    });

    it('still waits for the build when there is no earlier report', async function () {
        const { reportWithinBudget, clearStatusCache } =
            await import('../src/handlers/status-handlers.js');
        clearStatusCache();
        const built = { status: 'operational', groups: [], built: true };
        const slowButOk = () => new Promise((resolve) => setTimeout(() => resolve(built), 30));
        assert.strictEqual(
            await reportWithinBudget(false, null, { budgetMs: 5, compute: slowButOk }),
            built,
        );
    });
});
