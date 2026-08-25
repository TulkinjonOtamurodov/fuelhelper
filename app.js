import { createMockDataSource, getAttentionRecords, getInitials, getMetrics } from './data.js';

const app = document.querySelector('#app');
const dataSource = createMockDataSource();
const state = { records: [], view: 'dashboard', search: '', ownership: 'All ownership', status: 'All statuses', selectedId: null };
const viewNames = { dashboard: 'Overview', directory: 'Units & drivers', operations: 'Operations board', integrations: 'Integrations' };

const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
const statusClass = (value = '') => value.toLowerCase().replaceAll(' ', '-');
const initials = (name) => getInitials(name);
const recordById = (id) => state.records.find((record) => record.id === id);

function filteredRecords() {
  const query = state.search.trim().toLowerCase();
  return state.records.filter((record) => {
    const matchesQuery = !query || [record.unit, record.driver, record.notes, record.ownership].join(' ').toLowerCase().includes(query);
    const matchesOwnership = state.ownership === 'All ownership' || record.ownership === state.ownership;
    const matchesStatus = state.status === 'All statuses' || record.fuelStatus === state.status;
    return matchesQuery && matchesOwnership && matchesStatus;
  });
}

function renderMetric(label, value, detail, tone = '') {
  return `<article class="metric-card ${tone}"><div class="metric-top"><span class="eyebrow">${label}</span><span class="metric-icon">${tone === 'warning' ? '!' : tone === 'good' ? '↗' : '•'}</span></div><strong>${value}</strong><p>${detail}</p></article>`;
}

function renderStatus(value, type = 'fuel') {
  const tone = type === 'fuel' ? (value === 'Arranged' ? 'good' : value === 'Need to check' ? 'warning' : 'danger') : (value === 'Arranged' || value === 'Clear' ? 'good' : 'warning');
  return `<span class="status-pill ${tone}"><i></i>${escapeHtml(value || 'Not set')}</span>`;
}

function renderTable(records, compact = false) {
  if (!records.length) return `<div class="empty-state"><span>⌕</span><strong>No records found</strong><p>Try a different search or filter.</p></div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Unit / driver</th><th>Ownership</th><th>Compliance</th><th>Fuel status</th><th>Tolls</th><th>Check-in</th><th></th></tr></thead><tbody>${records.slice(0, compact ? 6 : 100).map((record) => `<tr data-record-id="${record.id}" class="record-row"><td><div class="person-cell"><span class="person-avatar">${initials(record.driver)}</span><div><strong>${escapeHtml(record.unit)}</strong><small>${escapeHtml(record.driver)}</small></div></div></td><td><span class="muted-label">${escapeHtml(record.ownership)}</span></td><td>${record.status === 'Cooperative' ? '<span class="status-text good-text">Cooperative</span>' : `<span class="status-text warning-text">${escapeHtml(record.status)}</span>`}</td><td>${renderStatus(record.fuelStatus)}</td><td>${renderStatus(record.tollStatus, 'toll')}</td><td><span class="check-in">${escapeHtml(record.checkInTime)}</span></td><td><button class="row-arrow" aria-label="Open ${escapeHtml(record.driver)}">→</button></td></tr>`).join('')}</tbody></table>${compact && records.length > 6 ? '<p class="table-footnote">Showing 6 priority records <button data-view="directory">View all units →</button></p>' : ''}</div>`;
}

function renderDashboard() {
  const metrics = getMetrics(state.records); const attention = getAttentionRecords(state.records);
  const arrangedPercent = metrics.total ? Math.round(metrics.arranged / metrics.total * 100) : 0;
  return `<section class="view dashboard-view"><div class="section-intro"><div><p class="eyebrow accent-eyebrow">Tuesday, August 26, 2026</p><h2>Fleet at a glance</h2><p class="lede">A clear view of what needs attention before the next dispatch.</p></div><button class="primary-button" data-view="directory">Open directory <span>→</span></button></div><div class="metric-grid">${renderMetric('Total units', metrics.total, 'Active in roster')}${renderMetric('Fuel arranged', `${arrangedPercent}%`, `${metrics.arranged} of ${metrics.total} units covered`, 'good')}${renderMetric('Needs action', metrics.pendingFuel, 'Fuel follow-ups outstanding', 'warning')}${renderMetric('Toll issues', metrics.tollIssues, 'Require a review today', 'danger')}</div><div class="dashboard-grid"><section class="panel priority-panel"><div class="panel-heading"><div><p class="eyebrow">Priority queue</p><h3>Needs your attention <span class="count-badge">${attention.length}</span></h3></div><button class="text-button" data-view="operations">View board →</button></div>${renderTable(attention, true)}</section><section class="panel pulse-panel"><div class="panel-heading"><div><p class="eyebrow">Fleet pulse</p><h3>Fuel coverage</h3></div><span class="trend-up">+8.4%</span></div><div class="coverage-ring" style="--coverage:${arrangedPercent * 3.6}deg"><div><strong>${arrangedPercent}%</strong><span>covered</span></div></div><div class="pulse-legend"><span><i class="dot green"></i> Arranged <b>${metrics.arranged}</b></span><span><i class="dot amber"></i> Pending <b>${metrics.pendingFuel}</b></span></div><div class="mini-note"><span>✦</span><p><strong>Good progress.</strong> Keep the pending queue below 20% before dispatch.</p></div></section></div></section>`;
}

function renderDirectory() {
  const records = filteredRecords();
  return `<section class="view"><div class="section-intro"><div><p class="eyebrow accent-eyebrow">Roster management</p><h2>Units &amp; drivers</h2><p class="lede">${state.records.length} records from the current operational roster.</p></div><button class="secondary-button" id="reset-filters">Reset filters</button></div><div class="toolbar"><label class="search-box"><span>⌕</span><input id="search-input" value="${escapeHtml(state.search)}" placeholder="Search unit, driver, note..." /></label><select id="ownership-filter"><option>All ownership</option><option ${state.ownership === 'Company' ? 'selected' : ''}>Company</option><option ${state.ownership === 'Vendor' ? 'selected' : ''}>Vendor</option><option ${state.ownership === 'Owner Operator' ? 'selected' : ''}>Owner Operator</option></select><select id="status-filter"><option>All statuses</option><option ${state.status === 'Arranged' ? 'selected' : ''}>Arranged</option><option ${state.status === 'Need to arrange' ? 'selected' : ''}>Need to arrange</option><option ${state.status === 'Need to check' ? 'selected' : ''}>Need to check</option><span class="result-count">${records.length} results</span></select></div><section class="panel directory-panel">${renderTable(records)}</section></section>`;
}

function renderOperations() {
  const groups = [['Need to arrange', 'Fuel queue', 'danger'], ['Need to check', 'Needs verification', 'warning'], ['Arranged', 'Ready to go', 'good']];
  return `<section class="view"><div class="section-intro"><div><p class="eyebrow accent-eyebrow">Daily workflow</p><h2>Operations board</h2><p class="lede">Move from exception to dispatch-ready, one unit at a time.</p></div><span class="board-date">Today · 26 Aug</span></div><div class="board-grid">${groups.map(([status, title, tone]) => { const items = state.records.filter((record) => record.fuelStatus === status); return `<section class="board-column ${tone}"><div class="column-heading"><span class="column-dot"></span><div><h3>${title}</h3><p>${status}</p></div><b>${items.length}</b></div><div class="board-cards">${items.slice(0, 8).map((record) => `<button class="board-card" data-record-id="${record.id}"><div class="card-row"><strong>${escapeHtml(record.unit)}</strong>${renderStatus(record.fuelStatus)}</div><p>${escapeHtml(record.driver)}</p><div class="card-meta"><span>${escapeHtml(record.ownership)}</span><span>${escapeHtml(record.checkInTime)}</span></div></button>`).join('') || '<div class="column-empty">All clear for now</div>'}</div>${items.length > 8 ? `<p class="more-items">+ ${items.length - 8} more units</p>` : ''}</section>`; }).join('')}</div></section>`;
}

function renderIntegrations() {
  return `<section class="view integrations-view"><div class="section-intro"><div><p class="eyebrow accent-eyebrow">System connections</p><h2>Integrations</h2><p class="lede">One operations layer, connected to the tools your team already uses.</p></div></div><section class="panel integration-hero"><div class="integration-symbol">↗</div><div><p class="eyebrow">Data source layer</p><h3>Ready for your next connection</h3><p>The interface is already separated from the data source. When you are ready, connect a secure API or Google Sheets reader without changing the dashboard.</p></div><span class="connection-state"><i></i> Adapter ready</span></section><div class="integration-grid"><article class="integration-card connected"><div class="integration-icon sheets">▦</div><div><h3>Google Sheets</h3><p>Fuel Management board</p></div><span class="tag">Planned</span><small>Read-only sync · API connector</small></article><article class="integration-card"><div class="integration-icon">⌁</div><div><h3>Telematics / GPS</h3><p>Location and mileage</p></div><span class="tag muted-tag">Coming later</span><small>Vehicle movement · odometer</small></article><article class="integration-card"><div class="integration-icon">$</div><div><h3>Fuel cards</h3><p>Transactions and spend</p></div><span class="tag muted-tag">Coming later</span><small>Purchase data · budgets</small></article></div><div class="integration-footnote"><span>ⓘ</span><p><strong>Safe by default.</strong> This prototype stores edits in memory only. No changes are sent to your board.</p></div></section>`;
}

function renderDrawer() {
  const record = recordById(state.selectedId); const drawer = document.querySelector('#record-drawer');
  if (!record) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); return; }
  drawer.innerHTML = `<div class="drawer-header"><div><p class="eyebrow">Unit profile</p><h2>${escapeHtml(record.unit)}</h2></div><button class="close-button" id="close-drawer" aria-label="Close details">×</button></div><div class="drawer-profile"><span class="large-avatar">${initials(record.driver)}</span><div><h3>${escapeHtml(record.driver)}</h3><p>${escapeHtml(record.ownership)} · ${escapeHtml(record.status || 'Status not set')}</p></div></div><div class="drawer-alert ${record.fuelStatus === 'Arranged' ? 'hidden' : ''}"><span>!</span><p><strong>Action required</strong><br />Fuel status needs an update before dispatch.</p></div><form id="edit-form" class="edit-form"><label>Fuel status<select name="fuelStatus"><option ${record.fuelStatus === 'Arranged' ? 'selected' : ''}>Arranged</option><option ${record.fuelStatus === 'Need to arrange' ? 'selected' : ''}>Need to arrange</option><option ${record.fuelStatus === 'Need to check' ? 'selected' : ''}>Need to check</option></select></label><label>Driver compliance<select name="status"><option ${record.status === 'Cooperative' ? 'selected' : ''}>Cooperative</option><option ${record.status === 'Partially cooperative' ? 'selected' : ''}>Partially cooperative</option><option ${record.status === 'Not following instructions' ? 'selected' : ''}>Not following instructions</option></select></label><label>Toll status<select name="tollStatus"><option ${record.tollStatus === 'Arranged' ? 'selected' : ''}>Arranged</option><option ${record.tollStatus === 'Clear' ? 'selected' : ''}>Clear</option><option ${record.tollStatus === 'Need review' ? 'selected' : ''}>Need review</option></select></label><label>Notes<textarea name="notes" rows="3" placeholder="Add an operational note...">${escapeHtml(record.notes)}</textarea></label><button class="primary-button full-width" type="submit">Save local changes <span>→</span></button></form><div class="drawer-meta"><span>Last check-in</span><strong>${escapeHtml(record.checkInTime)}</strong></div>`;
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
}

function render() {
  document.querySelector('#page-title').textContent = viewNames[state.view] === 'Overview' ? 'Good morning, operator.' : viewNames[state.view];
  document.querySelector('#breadcrumb').textContent = viewNames[state.view];
  document.querySelector('#nav-alert-count').textContent = getAttentionRecords(state.records).length;
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.view === state.view));
  app.innerHTML = state.view === 'dashboard' ? renderDashboard() : state.view === 'directory' ? renderDirectory() : state.view === 'operations' ? renderOperations() : renderIntegrations();
  renderDrawer();
}

function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); window.setTimeout(() => toast.classList.remove('show'), 2200); }
function openRecord(id) { state.selectedId = id; renderDrawer(); }
function closeDrawer() { state.selectedId = null; renderDrawer(); }

document.addEventListener('click', (event) => {
  const viewButton = event.target.closest('[data-view]'); if (viewButton) { state.view = viewButton.dataset.view; document.querySelector('.sidebar').classList.remove('mobile-open'); render(); return; }
  const row = event.target.closest('[data-record-id]'); if (row) { openRecord(row.dataset.recordId); return; }
  if (event.target.closest('#close-drawer') || event.target.id === 'drawer-backdrop') closeDrawer();
  if (event.target.closest('#reset-filters')) { state.search = ''; state.ownership = 'All ownership'; state.status = 'All statuses'; render(); }
  if (event.target.closest('#refresh-button')) { showToast('Mock data refreshed'); render(); }
  if (event.target.closest('#mobile-menu')) document.querySelector('.sidebar').classList.toggle('mobile-open');
});

document.addEventListener('input', (event) => { if (event.target.id === 'search-input') { state.search = event.target.value; render(); const input = document.querySelector('#search-input'); input.focus(); input.setSelectionRange(input.value.length, input.value.length); } });
document.addEventListener('change', (event) => { if (event.target.id === 'ownership-filter') state.ownership = event.target.value; if (event.target.id === 'status-filter') state.status = event.target.value; if (event.target.closest('#edit-form')) return; render(); });
document.addEventListener('submit', (event) => { if (event.target.id !== 'edit-form') return; event.preventDefault(); const formData = new FormData(event.target); const record = recordById(state.selectedId); Object.assign(record, { fuelStatus: formData.get('fuelStatus'), status: formData.get('status'), tollStatus: formData.get('tollStatus'), notes: formData.get('notes') }); showToast('Changes saved locally'); render(); });

async function boot() { app.innerHTML = '<div class="loading-state"><span class="spinner"></span> Loading fleet data...</div>'; try { state.records = await dataSource.getRecords(); render(); } catch (error) { app.innerHTML = `<div class="error-state"><strong>Could not load fleet data.</strong><p>${escapeHtml(error.message)}</p></div>`; } }
boot();
