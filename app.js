import { createApiDataSource, createMockDataSource, getAttentionRecords, getInitials, getMetrics, getQuickActions } from './data.js';

const app = document.querySelector('#app');
const demoMode = new URLSearchParams(window.location.search).get('demo') === '1';
const dataSource = demoMode ? createMockDataSource() : createApiDataSource();
const state = { records: [], view: 'dashboard', search: '', ownership: 'All ownership', status: 'All fuel states', selectedId: null, rules: [
  { id: 'fuel-follow-up', name: 'Fuel follow-up', when: 'Fuel is not arranged', then: 'Create action item', enabled: true },
  { id: 'toll-review', name: 'Toll review', when: 'Toll needs review', then: 'Mark as priority', enabled: true },
] };
const viewNames = { dashboard: 'Overview', directory: 'Units & drivers', operations: 'Action board', automations: 'Automations', integrations: 'Connections' };
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '>': '&gt;', '<': '&lt;', "'": '&#039;', '"': '&quot;' }[char]));
const getRecord = (id) => state.records.find((record) => record.id === id);
const initials = (name) => getInitials(name);
const tone = (value) => (value === 'Arranged' || value === 'Clear' || value === 'Cooperative' ? 'good' : value === 'Need to arrange' || value === 'Not following instructions' ? 'danger' : 'warning');
const pill = (value) => `<span class="status-pill ${tone(value)}"><i></i>${escapeHtml(value || 'Not set')}</span>`;

function getFilteredRecords() {
  const query = state.search.trim().toLowerCase();
  return state.records.filter((record) => (!query || [record.unit, record.driver, record.notes, record.ownership, record.fuelStatus].join(' ').toLowerCase().includes(query))
    && (state.ownership === 'All ownership' || record.ownership === state.ownership)
    && (state.status === 'All fuel states' || record.fuelStatus === state.status));
}

function metric(label, value, detail, kind = '') {
  return `<article class="metric-card ${kind}"><div class="metric-top"><span class="eyebrow">${label}</span><span>${kind === 'danger' ? '!' : kind === 'good' ? '↗' : '•'}</span></div><strong>${value}</strong><p>${detail}</p></article>`;
}

function table(records) {
  if (!records.length) return '<div class="empty-state"><span>⌕</span><strong>No units found</strong><p>Try clearing a filter or changing your search.</p></div>';
  return `<div class="table-wrap"><table><thead><tr><th>Unit / driver</th><th>Fuel</th><th>Tolls</th><th>Compliance</th><th>Next action</th></tr></thead><tbody>${records.map((record) => {
    const actions = getQuickActions(record);
    return `<tr class="record-row" data-record-id="${record.id}"><td><div class="person-cell"><span class="person-avatar">${initials(record.driver)}</span><div><strong>${escapeHtml(record.unit)}</strong><small>${escapeHtml(record.driver)}</small></div></div></td><td>${pill(record.fuelStatus)}</td><td>${pill(record.tollStatus)}</td><td><span class="compliance ${tone(record.status)}">${escapeHtml(record.status || 'Not set')}</span></td><td>${actions.length ? actions.map((action) => `<button class="quick-link" data-action="${action}" data-unit-id="${record.id}">${action === 'Mark fuel arranged' ? 'Fuel ready' : 'Clear toll'}</button>`).join('') : '<span class="muted-label">No actions</span>'}</td></tr>`;
  }).join('')}</tbody></table></div>`;
}

function dashboard() {
  const metrics = getMetrics(state.records); const attention = getAttentionRecords(state.records); const coverage = metrics.total ? Math.round(metrics.arranged / metrics.total * 100) : 0;
  return `<section class="view"><div class="page-hero"><div><p class="eyebrow accent-eyebrow">Wednesday, 26 August</p><h2>Fleet overview</h2><p class="lede">Review open items and update units from one place.</p></div><button class="primary-button" data-view="operations">Review action board <span>→</span></button></div><div class="metric-grid">${metric('Open actions', attention.length, 'Units requiring attention', 'danger')}${metric('Fuel ready', `${coverage}%`, `${metrics.arranged} of ${metrics.total} units`, 'good')}${metric('Toll reviews', metrics.tollIssues, 'Awaiting verification', 'warning')}${metric('Driver flags', metrics.complianceIssues, 'Need follow-up', 'warning')}</div><div class="focus-grid"><section class="panel action-panel"><div class="panel-heading"><div><p class="eyebrow">Priority</p><h3>Needs attention</h3></div><button class="text-button" data-view="directory">View all units</button></div><div class="priority-list">${attention.slice(0, 5).map((record) => `<button class="priority-item" data-record-id="${record.id}"><span class="priority-avatar">${initials(record.driver)}</span><span><strong>Unit ${escapeHtml(record.unit)}</strong><small>${escapeHtml(record.driver)} · ${record.fuelStatus !== 'Arranged' ? record.fuelStatus : record.tollStatus}</small></span>${pill(record.fuelStatus !== 'Arranged' ? record.fuelStatus : record.tollStatus)}</button>`).join('')}</div></section><section class="panel health-panel"><div class="panel-heading"><div><p class="eyebrow">Readiness</p><h3>Fleet status</h3></div><span class="score-status">${coverage >= 80 ? 'On track' : 'Review'}</span></div><div class="score-row"><div class="score-number">${coverage}<sup>%</sup></div><div><strong>Fuel coverage</strong><p>Current readiness across the active roster.</p></div></div><div class="progress-track"><span style="width:${coverage}%"></span></div><div class="health-notes"><span><i class="dot green"></i>${metrics.arranged} ready</span><span><i class="dot amber"></i>${metrics.pendingFuel} follow-ups</span></div></section></div></section>`;
}

function workspace(record) {
  if (!record) return '<section class="workspace-empty"><span>⌁</span><h3>Select a unit</h3><p>Choose a row to view its status and update the shared record.</p></section>';
  const actions = getQuickActions(record);
  return `<section class="workspace-panel"><div class="workspace-head"><div><p class="eyebrow">Selected unit</p><h3>${escapeHtml(record.unit)}</h3><p>${escapeHtml(record.driver)} · ${escapeHtml(record.ownership)}</p></div><span class="large-avatar">${initials(record.driver)}</span></div><div class="workspace-status"><div><span>Fuel</span>${pill(record.fuelStatus)}</div><div><span>Tolls</span>${pill(record.tollStatus)}</div><div><span>Compliance</span>${pill(record.status)}</div></div><div class="quick-actions"><p class="eyebrow">Quick actions</p>${actions.length ? actions.map((action) => `<button class="quick-action" data-action="${action}" data-unit-id="${record.id}">${action === 'Mark fuel arranged' ? '✓ Mark fuel arranged' : '✓ Clear toll review'}</button>`).join('') : '<p class="clear-message">No operational action is waiting.</p>'}</div><form id="unit-update-form" data-unit-id="${record.id}" class="unit-update-form"><p class="eyebrow">Edit details</p><label>Fuel status<select name="fuelStatus"><option ${record.fuelStatus === 'Arranged' ? 'selected' : ''}>Arranged</option><option ${record.fuelStatus === 'Need to arrange' ? 'selected' : ''}>Need to arrange</option><option ${record.fuelStatus === 'Need to check' ? 'selected' : ''}>Need to check</option></select></label><label>Toll status<select name="tollStatus"><option ${record.tollStatus === 'Arranged' ? 'selected' : ''}>Arranged</option><option ${record.tollStatus === 'Clear' ? 'selected' : ''}>Clear</option><option ${record.tollStatus === 'Need review' ? 'selected' : ''}>Need review</option></select></label><label>Compliance<select name="status"><option ${record.status === 'Cooperative' ? 'selected' : ''}>Cooperative</option><option ${record.status === 'Partially cooperative' ? 'selected' : ''}>Partially cooperative</option><option ${record.status === 'Not following instructions' ? 'selected' : ''}>Not following instructions</option></select></label><label class="notes-field">Operational note<textarea name="notes" rows="3" placeholder="Add a note for the team">${escapeHtml(record.notes)}</textarea></label><button type="submit" class="primary-button full-width">Save update <span>→</span></button></form><div class="workspace-footnote"><span>Last activity</span><strong>${escapeHtml(record.lastActivity || record.checkInTime)}</strong></div></section>`;
}

function directory() {
  const records = getFilteredRecords();
  return `<section class="view workspace-view"><div class="page-hero compact"><div><p class="eyebrow accent-eyebrow">Roster workspace</p><h2>Update a unit without losing your place.</h2><p class="lede">Quick actions stay in the list. Detailed updates remain stable in the right panel.</p></div></div><div class="workspace-layout"><section class="directory-column"><div class="toolbar"><label class="search-box"><span>⌕</span><input id="search-input" value="${escapeHtml(state.search)}" placeholder="Search driver, unit or note" /></label><select id="ownership-filter"><option>All ownership</option><option ${state.ownership === 'Company' ? 'selected' : ''}>Company</option><option ${state.ownership === 'Vendor' ? 'selected' : ''}>Vendor</option><option ${state.ownership === 'Owner Operator' ? 'selected' : ''}>Owner Operator</option></select><select id="status-filter"><option>All fuel states</option><option ${state.status === 'Arranged' ? 'selected' : ''}>Arranged</option><option ${state.status === 'Need to arrange' ? 'selected' : ''}>Need to arrange</option><option ${state.status === 'Need to check' ? 'selected' : ''}>Need to check</option></select></div><div class="result-line"><span>${records.length} matching units</span><button class="text-button" id="reset-filters">Clear filters</button></div><section class="panel directory-panel">${table(records)}</section></section><aside class="workspace-side">${workspace(getRecord(state.selectedId))}</aside></div></section>`;
}

function operations() {
  const columns = [['Need to arrange', 'Fuel now', 'danger', 'Fuel allocation required'], ['Need to check', 'Verify', 'warning', 'Confirm before dispatch'], ['Arranged', 'Ready', 'good', 'Fuel set for the next run']];
  return `<section class="view"><div class="page-hero compact"><div><p class="eyebrow accent-eyebrow">Operational flow</p><h2>Move the fleet forward.</h2><p class="lede">Each card has one obvious next action. Select it to open the full unit workspace.</p></div><span class="board-date">Today · 26 Aug</span></div><div class="board-grid">${columns.map(([status, title, kind, help]) => { const items = state.records.filter((record) => record.fuelStatus === status); return `<section class="board-column ${kind}"><div class="column-heading"><div><p class="eyebrow">${help}</p><h3>${title}</h3></div><b>${items.length}</b></div><div class="board-cards">${items.map((record) => `<article class="board-card"><button class="card-open" data-record-id="${record.id}"><div class="card-row"><strong>${escapeHtml(record.unit)}</strong>${pill(record.fuelStatus)}</div><p>${escapeHtml(record.driver)}</p><small>${escapeHtml(record.ownership)} · ${escapeHtml(record.checkInTime)}</small></button>${getQuickActions(record).map((action) => `<button class="card-action" data-action="${action}" data-unit-id="${record.id}">${action === 'Mark fuel arranged' ? 'Mark fuel arranged' : 'Clear toll review'}</button>`).join('')}</article>`).join('') || '<div class="column-empty">No units in this stage</div>'}</div></section>`; }).join('')}</div></section>`;
}

function automations() {
  return `<section class="view"><div class="page-hero compact"><div><p class="eyebrow accent-eyebrow">Automation center</p><h2>Define the workflow before connecting it.</h2><p class="lede">Rules are local prototypes today. Their structure is ready for a future API and Makima bot.</p></div><span class="prototype-chip">Local only</span></div><div class="automation-layout"><section class="panel rule-list-panel"><div class="panel-heading"><div><p class="eyebrow">Active rules</p><h3>${state.rules.filter((rule) => rule.enabled).length} automations enabled</h3></div></div><div class="rule-list">${state.rules.map((rule) => `<article class="rule-card"><button class="rule-toggle ${rule.enabled ? 'enabled' : ''}" data-rule-id="${rule.id}" aria-label="Toggle ${escapeHtml(rule.name)}"><i></i></button><div><strong>${escapeHtml(rule.name)}</strong><p><span>When</span> ${escapeHtml(rule.when)}</p><p><span>Then</span> ${escapeHtml(rule.then)}</p></div><span class="rule-state">${rule.enabled ? 'On' : 'Off'}</span></article>`).join('')}</div></section><section class="panel new-rule-panel"><p class="eyebrow">Create local rule</p><h3>What should happen automatically?</h3><form id="automation-form" class="automation-form"><label>Rule name<input name="name" required placeholder="Example: Overnight fuel check" /></label><label>When<select name="when"><option>Fuel is not arranged</option><option>Toll needs review</option><option>Driver is not cooperative</option></select></label><label>Then<select name="then"><option>Create action item</option><option>Mark as priority</option><option>Send to Telegram bot later</option></select></label><button class="primary-button full-width" type="submit">Add local automation <span>→</span></button></form><div class="automation-note"><span>ⓘ</span><p>“Send to Telegram bot later” is only a saved rule label. Nothing is sent outside this app.</p></div></section></div></section>`;
}

function integrations() {
  return `<section class="view"><div class="page-hero compact"><div><p class="eyebrow accent-eyebrow">Connections</p><h2>One operational source of truth.</h2><p class="lede">The dashboard and Makima use the same protected unit records. Google Sheets remains a future import option.</p></div></div><section class="panel api-blueprint"><div class="api-icon">⌘</div><div><p class="eyebrow">FuelHelper API</p><h3>${demoMode ? 'Demo connection' : 'Connected through the VPS'}</h3><p>The browser uses a protected server-side bridge. The private Bearer token is never sent to JavaScript.</p></div><span class="connection-state"><i></i>${demoMode ? 'Demo mode' : 'API configured'}</span></section><div class="endpoint-grid"><article><code>GET /api/units</code><p>Makima reads the shared fleet roster.</p></article><article><code>PATCH /api/units/:unit</code><p>Dashboard and bot persist status updates.</p></article><article><code>GET /api/health</code><p>Checks API availability without exposing data.</p></article></div><div class="integration-footnote"><span>ⓘ</span><p><strong>No AI usage.</strong> These are ordinary database requests and do not consume AI tokens.</p></div></section>`;
}

function render() {
  document.querySelector('#page-title').textContent = state.view === 'dashboard' ? 'Today’s fleet overview' : viewNames[state.view];
  document.querySelector('#breadcrumb').textContent = viewNames[state.view];
  document.querySelector('#nav-alert-count').textContent = getAttentionRecords(state.records).length;
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === state.view));
  app.innerHTML = ({ dashboard, directory, operations, automations, integrations })[state.view]();
}

async function updateRecord(id, changes, message) {
  const current = getRecord(id);
  if (!current) return;
  setConnectionState('syncing', 'Saving');
  try {
    const updated = await dataSource.updateRecord(current.unit, changes);
    state.records = state.records.map((record) => record.id === id ? updated : record);
    state.selectedId = updated.id;
    render();
    setConnectionState('ready', demoMode ? 'Demo mode' : 'Synced');
    showToast(message);
  } catch (error) {
    setConnectionState('error', 'Save failed');
    showToast(error.message);
  }
}

function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); window.setTimeout(() => toast.classList.remove('show'), 2200); }

function setConnectionState(kind, detail) {
  const label = document.querySelector('#sync-label');
  const detailNode = document.querySelector('#sync-detail');
  if (!label || !detailNode) return;
  label.className = `sync-label ${kind}`;
  detailNode.textContent = detail;
}

async function reloadRecords(showMessage = false) {
  setConnectionState('syncing', 'Refreshing');
  try {
    state.records = await dataSource.getRecords();
    if (state.selectedId && !getRecord(state.selectedId)) state.selectedId = null;
    render();
    setConnectionState('ready', demoMode ? 'Demo mode' : 'Synced');
    if (showMessage) showToast(demoMode ? 'Demo data reloaded' : 'Fleet data refreshed');
  } catch (error) {
    setConnectionState('error', 'Offline');
    if (state.records.length) showToast(error.message);
    else app.innerHTML = `<div class="error-state"><strong>Could not connect to FuelHelper.</strong><p>${escapeHtml(error.message)}</p><p>Use <code>?demo=1</code> only for a local preview.</p></div>`;
  }
}

document.addEventListener('click', (event) => {
  const view = event.target.closest('[data-view]'); if (view) { state.view = view.dataset.view; document.querySelector('.sidebar').classList.remove('mobile-open'); render(); return; }
  const action = event.target.closest('[data-action]'); if (action) { updateRecord(action.dataset.unitId, action.dataset.action === 'Mark fuel arranged' ? { fuelStatus: 'Arranged' } : { tollStatus: 'Clear' }, action.dataset.action === 'Mark fuel arranged' ? 'Fuel marked arranged' : 'Toll review cleared'); return; }
  const record = event.target.closest('[data-record-id]'); if (record) { state.selectedId = record.dataset.recordId; state.view = 'directory'; render(); return; }
  const rule = event.target.closest('[data-rule-id]'); if (rule) { state.rules = state.rules.map((item) => item.id === rule.dataset.ruleId ? { ...item, enabled: !item.enabled } : item); render(); return; }
  if (event.target.closest('#reset-filters')) { state.search = ''; state.ownership = 'All ownership'; state.status = 'All fuel states'; render(); }
  if (event.target.closest('#refresh-button')) reloadRecords(true);
  if (event.target.closest('#mobile-menu')) document.querySelector('.sidebar').classList.toggle('mobile-open');
});

document.addEventListener('input', (event) => { if (event.target.id === 'search-input') { state.search = event.target.value; render(); const input = document.querySelector('#search-input'); input.focus(); input.setSelectionRange(state.search.length, state.search.length); } });
document.addEventListener('change', (event) => { if (event.target.id === 'ownership-filter') { state.ownership = event.target.value; render(); } if (event.target.id === 'status-filter') { state.status = event.target.value; render(); } });
document.addEventListener('submit', (event) => {
  event.preventDefault(); const form = new FormData(event.target);
  if (event.target.id === 'unit-update-form') updateRecord(event.target.dataset.unitId, { fuelStatus: form.get('fuelStatus'), tollStatus: form.get('tollStatus'), status: form.get('status'), notes: form.get('notes') }, 'Unit updated');
  if (event.target.id === 'automation-form') { state.rules.push({ id: `rule-${Date.now()}`, name: form.get('name'), when: form.get('when'), then: form.get('then'), enabled: true }); render(); showToast('Local automation added'); }
});

async function boot() {
  app.innerHTML = `<div class="loading-state"><span class="spinner"></span> Loading ${demoMode ? 'demo' : 'shared'} fleet data...</div>`;
  document.querySelector('#workspace-mode').textContent = demoMode ? 'Demo workspace' : 'Shared workspace';
  document.querySelector('#workspace-detail').textContent = demoMode ? 'Changes reset on reload' : 'Makima + dashboard';
  await reloadRecords();
}
boot();
