// Dual-writes uptime checks into Metrion's ingest endpoint alongside the
// MongoDB `MonitorCheck` write checkMonitors.js already does. MongoDB stays
// the system of record — see mona's docs/adr/0007-uptime-monitoring-as-metrics.md
// for why this is a dual-write, not a repoint, and for the exact mapping
// implemented here. Uses the global `fetch` the Functions Node runtime
// already provides — no new dependency for one POST per run.

// Mirrors the IDENTIFIER charset Metrion's ingest schema enforces
// (mona/applications/ingest/src/schemas/ingest.schemas.ts) — duplicated
// rather than imported for the same reason the Mongoose schemas above are:
// this Function App deploys independently of Metrion.
function slugify(value) {
    return (value ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9._:-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

// resource = slugified monitor.group, falling back to slugified monitor.name
// when group is empty; sub_resource = slugified monitor.name, or null when
// name was already used as the resource. Returns null when even the
// fallback slug is empty, so the caller can drop the point rather than send
// ingest an identifier that would 400 the whole batch.
function resourceFor(monitor) {
    const group = slugify(monitor.group);
    const name = slugify(monitor.name);
    if (group) return { resource: group, subResource: name || null };
    return name ? { resource: name, subResource: null } : null;
}

function createMetrionSink() {
    const url = process.env.METRION_INGEST_URL;
    const key = process.env.METRION_API_KEY;
    const enabled = Boolean(url && key);
    const envelopes = new Map(); // "resource\0subResource" -> { resource, subResource, metrics }

    function add(monitor, check, context) {
        if (!enabled) return;
        const target = resourceFor(monitor);
        if (!target) {
            context?.warn?.(`metrion-sink: monitor "${monitor.name}" has no usable slug, skipped`);
            return;
        }
        const timestamp = new Date(check.at).toISOString();
        const metrics = [
            {
                name: 'uptime.ok',
                value: check.ok ? 1 : 0,
                unit: 'boolean',
                timestamp,
                interval: 60,
            },
        ];
        // Only a plain HTTP probe measures the monitored app's own latency —
        // an ARM check's latencyMs is the control-plane round trip (ADR 0007 §4).
        if (check.runningStatus == null) {
            metrics.push({
                name: 'uptime.latency',
                value: check.latencyMs,
                unit: 'ms',
                timestamp,
                interval: 60,
            });
        }
        const bucketKey = `${target.resource}\0${target.subResource ?? ''}`;
        if (!envelopes.has(bucketKey)) {
            envelopes.set(bucketKey, {
                resource: target.resource,
                ...(target.subResource ? { subResource: target.subResource } : {}),
                metrics: [],
            });
        }
        envelopes.get(bucketKey).metrics.push(...metrics);
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

export { createMetrionSink, slugify, resourceFor };
