const seedRows = [
  ['1290', 'Gregory Petit', 'No TA', 'Company', 'Cooperative', 'Need to arrange', 'Required', 'Need review', 'Today, 09:15'],
  ['123', 'Sibomana Mordekayi', '', 'Company', 'Cooperative', 'Arranged', 'Clear', 'Arranged', 'Today, 08:40'],
  ['106', 'Woodruf Franlin', '', 'Company', 'Cooperative', 'Need to arrange', 'Required', 'Need review', 'Yesterday, 17:20'],
  ['117', 'SAID KALINLE', '', 'Company', 'Cooperative', 'Need to arrange', 'Required', 'Need review', 'Yesterday, 16:55'],
  ['128', 'Niyabizi Muhire', '', 'Company', 'Partially cooperative', 'Arranged', 'Clear', 'Arranged', 'Today, 07:50'],
  ['142', 'Innocent Kumwami', '', 'Company', 'Partially cooperative', 'Need to arrange', 'Required', 'Arranged', 'Yesterday, 15:40'],
  ['145', 'Innocent Karangwa', '', 'Company', 'Cooperative', 'Arranged', 'Clear', 'Arranged', 'Today, 08:05'],
  ['144', 'Jarwee Victor', '', 'Company', 'Partially cooperative', 'Arranged', 'Required', 'Arranged', 'Today, 06:40'],
  ['141', 'Mvisena Masimbuka', '', 'Company', 'Not following instructions', 'Arranged', 'Required', 'Need review', 'Yesterday, 13:10'],
  ['148', 'Zamor Ulrick', '', 'Company', '', 'Arranged', 'Clear', 'Arranged', 'Today, 09:02'],
  ['146', 'Parris Marquis', '', 'Vendor', 'Cooperative', 'Arranged', 'Required', 'Arranged', 'Today, 07:30'],
  ['108', 'Abdelrahman Ahmed', 'No TA', 'Vendor', 'Cooperative', 'Arranged', 'Clear', 'Arranged', 'Yesterday, 18:05'],
  ['139', 'Elfahla Karim', '', 'Vendor', 'Cooperative', 'Arranged', 'Required', 'Arranged', 'Today, 08:25'],
  ['121', 'Farrukh Boltaev', '', 'Vendor', 'Cooperative', 'Arranged', 'Required', 'Arranged', 'Today, 07:14'],
  ['137', 'Socrate Irampaye', '', 'Vendor', 'Cooperative', 'Need to arrange', 'Required', 'Need review', 'Yesterday, 16:22'],
  ['119', 'Muhammed Sidali', '', 'Vendor', 'Cooperative', 'Arranged', 'Clear', 'Arranged', 'Today, 08:48'],
  ['135', 'Bakhtiyor Donayarov', '', 'Vendor', 'Cooperative', 'Arranged', 'Required', 'Arranged', 'Yesterday, 17:42'],
  ['133', 'George Haycraft', '', 'Vendor', 'Partially cooperative', 'Arranged', 'Required', 'Need review', 'Today, 06:58'],
  ['140', 'Abdou Kone', '', 'Vendor', 'Cooperative', 'Arranged', 'Required', 'Arranged', 'Today, 08:10'],
  ['134', 'Mandila Kafi', '', 'Vendor', 'Cooperative', 'Arranged', 'Required', 'Arranged', 'Today, 08:18'],
  ['104', 'Belony Fortune', '', 'Vendor', 'Cooperative', 'Arranged', 'Clear', 'Arranged', 'Yesterday, 19:10'],
  ['453', 'Robles Gerardo', '', 'Vendor', 'Not following instructions', 'Need to arrange', 'Required', 'Need review', 'Yesterday, 12:44'],
  ['122', 'Nd Qiyin Name', '', 'Vendor', 'Partially cooperative', 'Arranged', 'Required', 'Arranged', 'Today, 06:20'],
  ['116', 'Jazmeen Norwood', '', 'Vendor', 'Partially cooperative', 'Need to arrange', 'Required', 'Need review', 'Yesterday, 14:30'],
  ['130', 'Hashim Salof', '', 'Vendor', 'Not following instructions', 'Arranged', 'Required', 'Need review', 'Today, 05:55'],
  ['150', 'Yronce Certilus', '', 'Company', 'Partially cooperative', 'Arranged', 'Clear', 'Arranged', 'Today, 08:01'],
  ['202', 'Kim Artur', '', 'Owner Operator', 'Partially cooperative', 'Need to check', 'Required', 'Need review', 'Yesterday, 10:12'],
  ['891', 'Ronald Rush', '', 'Company', 'Partially cooperative', 'Arranged', 'Required', 'Arranged', 'Today, 07:05'],
  ['899', 'Noel Steevenson', '', 'Vendor', 'Partially cooperative', 'Need to arrange', 'Required', 'Need review', 'Yesterday, 16:05'],
  ['9992', 'William Lugo', '', 'Vendor', 'Partially cooperative', 'Arranged', 'Required', 'Arranged', 'Today, 08:33'],
  ['151', 'Dieudonne Shyaka', '', 'Vendor', 'Cooperative', 'Arranged', 'Clear', 'Arranged', 'Today, 09:07'],
  ['152', 'Fernando Vallejos Rivas', '', 'Vendor', 'Partially cooperative', 'Need to check', 'Required', 'Need review', 'Yesterday, 11:18'],
  ['127', 'Dakim Clerk', '', 'Vendor', 'Partially cooperative', 'Arranged', 'Required', 'Arranged', 'Today, 07:45'],
];

export const mockRecords = seedRows.map(([unit, driver, notes, ownership, status, fuelStatus, tolls, tollStatus, checkInTime], index) => ({
  id: `unit-${unit}-${index}`,
  unit,
  driver,
  notes,
  ownership: ownership.trim(),
  status,
  fuelStatus: fuelStatus.trim(),
  tolls,
  tollStatus,
  checkInTime,
  lastActivity: index % 3 === 0 ? 'Needs follow-up' : 'Updated recently',
}));

export function createMockDataSource() {
  let records = structuredClone(mockRecords);
  return {
    name: 'Local prototype data',
    async getRecords() {
      return structuredClone(records);
    },
    async updateRecord(unitNumber, changes) {
      const index = records.findIndex((record) => record.unit === unitNumber);
      if (index < 0) throw new Error(`Unit ${unitNumber} was not found`);
      records[index] = applyRecordUpdate(records[index], changes);
      return structuredClone(records[index]);
    },
  };
}

export function getMetrics(records) {
  return {
    total: records.length,
    arranged: records.filter((record) => record.fuelStatus === 'Arranged').length,
    pendingFuel: records.filter((record) => record.fuelStatus !== 'Arranged').length,
    tollIssues: records.filter((record) => record.tollStatus !== 'Arranged' && record.tollStatus !== 'Clear').length,
    complianceIssues: records.filter((record) => record.status === 'Not following instructions').length,
  };
}

export function getAttentionRecords(records) {
  return records.filter((record) => record.fuelStatus !== 'Arranged' || record.tollStatus === 'Need review' || record.status === 'Not following instructions');
}

const apiFieldMap = {
  driver: 'driver',
  notes: 'notes',
  ownership: 'ownership',
  status: 'status',
  fuelStatus: 'fuel_status',
  tolls: 'tolls',
  tollStatus: 'toll_status',
  checkInTime: 'check_in_time',
};

export function mapApiUnit(unit) {
  return {
    id: `unit-${unit.unit_number}`,
    unit: unit.unit_number,
    driver: unit.driver ?? '',
    notes: unit.notes ?? '',
    ownership: unit.ownership ?? '',
    status: unit.status ?? '',
    fuelStatus: unit.fuel_status ?? '',
    tolls: unit.tolls ?? '',
    tollStatus: unit.toll_status ?? '',
    checkInTime: unit.check_in_time ?? '',
    lastActivity: unit.updated_at ?? unit.created_at ?? '',
  };
}

export function toApiPatch(changes) {
  return Object.fromEntries(Object.entries(changes)
    .filter(([field]) => field in apiFieldMap)
    .map(([field, value]) => [apiFieldMap[field], value]));
}

async function readJson(response) {
  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = typeof payload?.detail === 'string' ? payload.detail : `FuelHelper API request failed (${response.status})`;
    throw new Error(detail);
  }
  return payload;
}

export function createApiDataSource({ baseUrl = '/dashboard-api', fetchImpl = globalThis.fetch } = {}) {
  const request = async (path, options = {}) => readJson(await fetchImpl(`${baseUrl}${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
  }));

  return {
    name: 'FuelHelper API',
    async getRecords() {
      const units = await request('/units');
      return units.map(mapApiUnit);
    },
    async updateRecord(unitNumber, changes) {
      const unit = await request(`/units/${encodeURIComponent(unitNumber)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toApiPatch(changes)),
      });
      return mapApiUnit(unit);
    },
  };
}

export function getQuickActions(record) {
  const actions = [];
  if (record.fuelStatus !== 'Arranged') actions.push('Mark fuel arranged');
  if (record.tollStatus === 'Need review') actions.push('Clear toll review');
  return actions;
}

export function applyRecordUpdate(record, changes) {
  return {
    ...record,
    ...changes,
    lastActivity: 'Updated locally',
  };
}

export function getInitials(name) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
