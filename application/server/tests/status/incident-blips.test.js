/* ***************** IMPORT packages *********************** */
import assert from 'assert';
import { visibleIncidents, MIN_INCIDENT_SECONDS } from '../../src/utils/metrion-adapter.js';

/* ***************** SETUP demo data *********************** */
const inc = (durationSeconds, extra = {}) => ({
    startedAt: '2026-11-24T10:00:00.000Z',
    endedAt: '2026-11-24T10:05:00.000Z',
    durationSeconds,
    downSamples: Math.ceil(durationSeconds / 60),
    ...extra,
});

/* ***************** DECLARE testfunctions *********************** */
describe('incidents shorter than a minute are not listed', function () {
    it('drops a one-check blip and keeps a real outage', function () {
        const { incidents, totalIncidents } = visibleIncidents({
            incidents: [inc(60), inc(0), inc(180)],
            totalIncidents: 3,
        });
        assert.deepStrictEqual(
            incidents.map((i) => i.durationSeconds),
            [180],
        );
        assert.equal(totalIncidents, 1);
    });

    it('keeps exactly the incidents longer than the limit', function () {
        assert.equal(MIN_INCIDENT_SECONDS, 60);
        const { incidents } = visibleIncidents({
            incidents: [inc(60), inc(61)],
            totalIncidents: 2,
        });
        assert.deepStrictEqual(
            incidents.map((i) => i.durationSeconds),
            [61],
        );
    });

    it('counts an outage that is still going by how long it has lasted', function () {
        const { incidents } = visibleIncidents({
            incidents: [inc(300, { endedAt: null })],
            totalIncidents: 1,
        });
        assert.equal(incidents.length, 1);
        assert.equal(incidents[0].endedAt, null);
    });

    it('keeps the total of incidents that were cut off from the list, minus the blips seen', function () {
        const { totalIncidents } = visibleIncidents({
            incidents: [inc(30), inc(500)],
            totalIncidents: 40,
        });
        assert.equal(totalIncidents, 39);
    });

    it('answers with an empty list when there is no range data', function () {
        assert.deepStrictEqual(visibleIncidents(undefined), { incidents: [], totalIncidents: 0 });
    });
});
