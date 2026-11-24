/**
 * Answers with `promise`'s value, or with `fallback()` when it takes longer than `ms` or rejects. The promise is
 * left running, so whatever it was building still lands in its cache for the next caller.
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {(reason: 'slow' | 'failed', error?: unknown) => T} fallback
 * @returns {Promise<T>}
 */
export async function withBudget(promise, ms, fallback) {
    let timer;
    const late = new Promise((resolve) => {
        timer = setTimeout(() => resolve(LATE), ms);
    });
    try {
        const result = await Promise.race([promise, late]);
        return result === LATE ? fallback('slow') : result;
    } catch (error) {
        return fallback('failed', error);
    } finally {
        clearTimeout(timer);
    }
}

const LATE = Symbol('late');
