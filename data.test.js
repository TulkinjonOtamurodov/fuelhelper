import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyRecordUpdate,
  getMetrics,
  getAttentionRecords,
  getQuickActions,
  createApiDataSource,
  mapApiUnit,
  toApiPatch,
} from './data.js';

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

test('mapApiUnit converts the backend contract into the existing UI record shape', () => {
  assert.deepEqual(mapApiUnit({
    unit_number: '152',
    driver: 'Fernando Vallejos Rivas',
    notes: 'Fuel card verified',
    ownership: 'Vendor',
    status: 'Partially cooperative',
    fuel_status: 'Need to check',
    tolls: 'Required',
    toll_status: 'Need review',
    check_in_time: 'Today, 08:15',
    created_at: '2026-08-26T01:00:00Z',
    updated_at: '2026-08-26T03:30:00Z',
  }), {
    id: 'unit-152',
    unit: '152',
    driver: 'Fernando Vallejos Rivas',
    notes: 'Fuel card verified',
    ownership: 'Vendor',
    status: 'Partially cooperative',
    fuelStatus: 'Need to check',
    tolls: 'Required',
    tollStatus: 'Need review',
    checkInTime: 'Today, 08:15',
    lastActivity: '2026-08-26T03:30:00Z',
  });
});

test('toApiPatch sends only supported fields using backend names', () => {
  assert.deepEqual(toApiPatch({
    driver: 'Updated Driver',
    fuelStatus: 'Arranged',
    tollStatus: 'Clear',
    notes: 'Confirmed',
    lastActivity: 'must not be sent',
    id: 'must not be sent',
  }), {
    driver: 'Updated Driver',
    fuel_status: 'Arranged',
    toll_status: 'Clear',
    notes: 'Confirmed',
  });
});

test('API data source loads and maps dashboard units', async () => {
  const requests = [];
  const source = createApiDataSource({
    baseUrl: '/dashboard-api',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        json: async () => [{ unit_number: '152', driver: 'Fernando', fuel_status: 'Arranged' }],
      };
    },
  });

  const units = await source.getRecords();

  assert.equal(requests[0].url, '/dashboard-api/units');
  assert.equal(requests[0].options.headers.Accept, 'application/json');
  assert.equal(units[0].unit, '152');
  assert.equal(units[0].fuelStatus, 'Arranged');
});

test('API data source patches a unit with the backend field contract', async () => {
  const requests = [];
  const source = createApiDataSource({
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        json: async () => ({ unit_number: '152', driver: 'Fernando', fuel_status: 'Need to arrange' }),
      };
    },
  });

  const updated = await source.updateRecord('152', { fuelStatus: 'Need to arrange', id: 'ignored' });

  assert.equal(requests[0].url, '/dashboard-api/units/152');
  assert.equal(requests[0].options.method, 'PATCH');
  assert.equal(requests[0].options.headers['Content-Type'], 'application/json');
  assert.equal(requests[0].options.body, JSON.stringify({ fuel_status: 'Need to arrange' }));
  assert.equal(updated.fuelStatus, 'Need to arrange');
});

test('API data source reports backend error details', async () => {
  const source = createApiDataSource({
    fetchImpl: async () => ({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Invalid fuel status' }),
    }),
  });

  await assert.rejects(source.getRecords(), /Invalid fuel status/);
});
