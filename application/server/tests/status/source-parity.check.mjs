// Task 17: proves the mongo and metrion sources agree BEFORE anyone flips
// STATUS_SOURCE in production. Builds getStatusReport() twice in one process
// (source='mongo' then source='metrion') against LIVE Mongo + a LIVE Metrion
// feed, and prints a per-monitor diff. NOT wired into `npm test` — unlike
// every other *.check.mjs in this directory, it needs real credentials and
// a reachable Metrion endpoint, neither of which the rest of the suite
// requires.
//
// Run it:
//
//   MONGODB_CONNECTION_STRING=<mongo uri> \
//   METRION_STATUS_URL=https://metrion-ingest.woofi-developments.at/api/v1/public/projects/86b02c8c-4357-4655-9835-1897787cdd9a/uptime \
//   node application/server/tests/status/source-parity.check.mjs
//
// MONGODB_CONNECTION_STRING unset -> prints a message and exits 0 (a skip,
// not a failure), so nothing breaks a CI run that never sets it.
//
// For a REAL comparison this needs to run against PRODUCTION'S Mongo: a
// local/dev database has no monitor documents carrying the real `metrionKey`
// values the live Metrion feed was seeded under (commit 8cc6913), so every
// entry would report "present in mongo, absent from metrion" — a false
// mismatch, not a real one.
//
// Exit code is non-zero if any of the (expected 7) monitors is missing from
// either side, or if h24/d7/d30 uptime differs by more than 1.0 percentage
// point between the two sources. The 1.0pp tolerance is not arbitrary: it is
// the measured spread between the VPS checker's ~5 min effective cadence
// (Azure timer replay makes it uneven), the old 1-minute nominal schedule,
// and Metrion's now-authoritative 60s vantage — three different sampling
// densities over the same real uptime will not agree to the decimal point.
import mongoose from 'mongoose';
import { getStatusReport } from '../../src/utils/status-checker.js';

const TOLERANCE_PCT = 1.0;
const UPTIME_WINDOWS = ['h24', 'd7', 'd30'];

function flattenByName(report) {
    const monitors = [...report.groups.flatMap((g) => g.monitors), ...report.ungrouped];
    return new Map(monitors.map((m) => [m.name, m]));
}

function historyDaysWithData(monitor) {
    return monitor.history.filter((d) => d.totalChecks > 0).length;
}

async function main() {
    const connectionString = process.env.MONGODB_CONNECTION_STRING;
    if (!connectionString) {
        console.log(
            'source-parity.check.mjs: MONGODB_CONNECTION_STRING is unset — skipping. ' +
                "See this file's header for how to run it against a real database.",
        );
        return;
    }

    await mongoose.connect(connectionString, { serverSelectionTimeoutMS: 5000 });

    let failed = false;
    try {
        const [mongoReport, metrionReport] = await Promise.all([
            getStatusReport(true, 'mongo'),
            getStatusReport(true, 'metrion'),
        ]);

        const mongoByName = flattenByName(mongoReport);
        const metrionByName = flattenByName(metrionReport);
        const names = new Set([...mongoByName.keys(), ...metrionByName.keys()]);

        console.log(`source-parity: comparing ${names.size} monitor(s)`);
        if (metrionReport.stale) {
            console.log(
                `source-parity: WARNING the metrion report is stale (staleSince ${metrionReport.staleSince}) — this run is not comparing live data`,
            );
            failed = true;
        }

        for (const name of names) {
            const m = mongoByName.get(name);
            const t = metrionByName.get(name);

            if (!m || !t) {
                failed = true;
                console.log(`  ${name}: MISSING from the ${!m ? 'mongo' : 'metrion'} side`);
                continue;
            }

            const mismatches = [];
            for (const window of UPTIME_WINDOWS) {
                const a = m.uptime[window];
                const b = t.uptime[window];
                if (a == null || b == null) continue; // one side has no data yet — not a disagreement
                if (Math.abs(a - b) > TOLERANCE_PCT) {
                    mismatches.push(`${window} ${a} vs ${b} (>${TOLERANCE_PCT}pp)`);
                }
            }
            if (mismatches.length) failed = true;

            console.log(
                `  ${name}: status ${m.status}/${t.status} | ` +
                    `h24 ${m.uptime.h24}/${t.uptime.h24} | d7 ${m.uptime.d7}/${t.uptime.d7} | d30 ${m.uptime.d30}/${t.uptime.d30} | ` +
                    `latency p50 ${m.latency?.p50 ?? 'n/a'}/${t.latency?.p50 ?? 'n/a'} p95 ${m.latency?.p95 ?? 'n/a'}/${t.latency?.p95 ?? 'n/a'} | ` +
                    `history-days-with-data ${historyDaysWithData(m)}/${historyDaysWithData(t)}` +
                    (mismatches.length ? `  MISMATCH: ${mismatches.join(', ')}` : ''),
            );
        }
    } finally {
        await mongoose.disconnect();
    }

    if (failed) {
        console.error('source-parity.check.mjs: FAILED — see mismatches above');
        process.exitCode = 1;
    } else {
        console.log('source-parity.check.mjs: mongo and metrion agree within tolerance');
    }
}

await main();
