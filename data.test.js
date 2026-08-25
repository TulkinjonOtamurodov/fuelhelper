import test from 'node:test';
import assert from 'node:assert/strict';
import { applyRecordUpdate, getMetrics, getAttentionRecords, getQuickActions } from './data.js';

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

test('getQuickActions presents only the next useful operational actions', () => {
  assert.deepEqual(getQuickActions(records[1]), ['Mark fuel arranged', 'Clear toll review']);
  assert.deepEqual(getQuickActions(records[0]), []);
});

test('applyRecordUpdate changes only requested record fields and records a local activity', () => {
  const updated = applyRecordUpdate(
    { id: 'unit-123', fuelStatus: 'Need to arrange', tollStatus: 'Need review', notes: '' },
    { fuelStatus: 'Arranged', notes: 'Fuel card confirmed' },
  );

  assert.equal(updated.fuelStatus, 'Arranged');
  assert.equal(updated.tollStatus, 'Need review');
  assert.equal(updated.notes, 'Fuel card confirmed');
  assert.equal(updated.lastActivity, 'Updated locally');
});
