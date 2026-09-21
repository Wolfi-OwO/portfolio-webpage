// Dual-writes uptime checks into Metrion's ingest endpoint alongside the
// MongoDB `MonitorCheck` write checkMonitors.js already does. MongoDB stays
// the system of record — see mona's docs/adr/0007-uptime-monitoring-as-metrics.md
// for why this is a dual-write, not a repoint, and for the exact mapping
// implemented here. Uses the global `fetch` the Functions Node runtime
// already provides — no new dependency for one POST per run.

function createMetrionSink() {
    const url = process.env.METRION_INGEST_URL;
    const key = process.env.METRION_API_KEY;
    const enabled = Boolean(url && key);
    const envelopes = new Map(); // metrionKey -> { resource, metrics }

    // The resource is the monitor's explicit `metrionKey`, one resource per
    // monitor and never a sub_resource: deriving it from group/name once made
    // "Network Visualizer" land as `network-visualizer` (Metrion's key is
    // `netviz`) and folded Portfolio + Status Page into one averaged resource.
    function add(monitor, check, context) {
        if (!enabled) return;
        const resource = monitor.metrionKey;
        if (!resource) {
            context?.warn?.(`metrion-sink: monitor "${monitor.name}" has no metrionKey, skipped`);
            return;
        }
        const timestamp = new Date(check.at).toISOString();
        const point = (name, value, unit) => ({
            name,
            value,
            unit,
            intervalSeconds: 60,
            timestamp,
        });
        const isArm = check.runningStatus != null;
        const metrics = [point('uptime.ok', check.ok ? 1 : 0, 'boolean')];
        // Only a plain HTTP probe measures the monitored app's own latency —
        // an ARM check's latencyMs is the control-plane round trip (ADR 0007 §4).
        if (!isArm) metrics.push(point('uptime.latency', check.latencyMs, 'ms'));
        // Idle only exists for ARM-checked (scale-to-zero) monitors.
        if (isArm) {
            metrics.push(
                point('uptime.idle', check.runningStatus === 'ScaledToZero' ? 1 : 0, 'boolean'),
            );
        }
        if (!envelopes.has(resource)) envelopes.set(resource, { resource, metrics: [] });
        envelopes.get(resource).metrics.push(...metrics);
    }

    async function flush(context) {
        if (!enabled || envelopes.size === 0) return;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
                body: JSON.stringify([...envelopes.values()]),
            });
            if (!response.ok) {
                context?.warn?.(`metrion-sink: ingest responded ${response.status}`);
            }
        } catch (err) {
            // ponytail: no retry queue; MongoDB is the durable copy, re-backfill if a gap ever matters.
            context?.warn?.(`metrion-sink: POST failed: ${err.message}`);
        }
    }

    return { add, flush };
}

export { createMetrionSink };
