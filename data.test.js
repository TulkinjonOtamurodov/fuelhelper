import test from 'node:test';
import assert from 'node:assert/strict';
import { getMetrics, getAttentionRecords } from './data.js';

const records = [
  { fuelStatus: 'Arranged', tollStatus: 'Clear', status: 'Cooperative' },
  { fuelStatus: 'Need to arrange', tollStatus: 'Need review', status: 'Partially cooperative' },
  { fuelStatus: 'Need to check', tollStatus: 'Arranged', status: 'Not following instructions' },
];

test('getMetrics summarizes fleet fuel and toll health', () => {
  assert.deepEqual(getMetrics(records), {
    total: 3,
    arranged: 1,
    pendingFuel: 2,
    tollIssues: 1,
    complianceIssues: 1,
  });
});

test('getAttentionRecords returns fuel, toll, and compliance exceptions', () => {
  assert.equal(getAttentionRecords(records).length, 2);
});
