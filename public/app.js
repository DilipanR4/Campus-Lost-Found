const state = {
  user: null,
  items: [],
  filters: { search: '', type: 'all', category: 'all', status: 'active' }
};

const elements = {
  grid: document.querySelector('#itemsGrid'), empty: document.querySelector('#emptyState'), summary: document.querySelector('#resultSummary'),
  search: document.querySelector('#searchInput'), type: document.querySelector('#typeFilter'), category: document.querySelector('#categoryFilter'), status: document.querySelector('#statusFilter'),
  form: document.querySelector('#reportForm'), message: document.querySelector('#formMessage'), description: document.querySelector('#itemDescription'), descriptionCount: document.querySelector('#descriptionCount'), date: document.querySelector('#itemDate'),
  total: document.querySelector('#totalCount'), lost: document.querySelector('#lostCount'), found: document.querySelector('#foundCount'), returned: document.querySelector('#returnedCount'),
  userBadge: document.querySelector('#userBadge'), welcomeTitle: document.querySelector('#welcomeTitle'), roleDescription: document.querySelector('#roleDescription'), adminNote: document.querySelector('#adminNote'),
  reportNav: document.querySelector('#reportNav'), heroReportButton: document.querySelector('#heroReportButton'), emptyReportButton: document.querySelector('#emptyReportButton'), logout: document.querySelector('#logoutButton')
};

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function formatDate(value) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function filteredItems() {
  const { search, type, category, status } = state.filters;
  const query = search.toLowerCase();
  return state.items.filter((item) => {
    const searchable = `${item.title} ${item.description} ${item.location} ${item.category}`.toLowerCase();
    return (!query || searchable.includes(query)) && (type === 'all' || item.type === type) && (category === 'all' || item.category === category) && (status === 'all' || item.status === status);
  });
}

function renderUser() {
  const { name, username, role } = state.user;
  elements.userBadge.textContent = `${name} · ${role}`;
  elements.welcomeTitle.textContent = `Hello, ${name}`;
  elements.roleDescription.textContent = role === 'admin'
    ? `Logged in as ${username}. Admins can browse every report and change the status of any report.`
    : `Logged in as ${username}. Students can browse campus reports, submit reports, and change the status of their own reports.`;
  elements.adminNote.classList.toggle('hidden', role !== 'admin');
}

function renderStats() {
  elements.total.textContent = state.items.length;
  elements.lost.textContent = state.items.filter((item) => item.type === 'lost' && item.status === 'active').length;
  elements.found.textContent = state.items.filter((item) => item.type === 'found' && item.status === 'active').length;
  elements.returned.textContent = state.items.filter((item) => item.status === 'returned').length;
}

function renderItems() {
  const items = filteredItems();
  elements.grid.innerHTML = '';
  elements.summary.textContent = `${items.length} report${items.length === 1 ? '' : 's'} shown`;
  if (!items.length) { elements.empty.classList.remove('hidden'); return; }
  elements.empty.classList.add('hidden');

  elements.grid.innerHTML = items.map((item) => {
    const badgeClass = item.status === 'returned' ? 'badge-returned' : `badge-${item.type}`;
    const badgeText = item.status === 'returned' ? 'Returned' : item.type;
    let action = '<span class="item-owner-note">View only</span>';
    if (state.user.role === 'admin' || item.isOwner) {
      action = item.status === 'active'
        ? `<button class="item-action" data-return-id="${escapeHtml(item.id)}">Mark as returned</button>`
        : `<button class="item-action" data-reopen-id="${escapeHtml(item.id)}">Reopen report</button>`;
    }
    const ownerLabel = item.isOwner ? '<span class="owner-label">Your report</span>' : '';
    return `<article class="item-card"><div class="item-top"><span class="badge ${badgeClass}">${escapeHtml(badgeText)}</span><span class="item-category">${escapeHtml(item.category)}</span></div><h3>${escapeHtml(item.title)} ${ownerLabel}</h3><p class="item-description">${escapeHtml(item.description)}</p><div class="item-meta"><span><strong>Location:</strong> ${escapeHtml(item.location)}</span><span><strong>Date:</strong> ${escapeHtml(formatDate(item.date))}</span><span><strong>Contact:</strong> ${escapeHtml(item.contact)}</span><span><strong>Reported by:</strong> ${escapeHtml(item.ownerName || 'Campus user')}</span></div>${action}</article>`;
  }).join('');
}

async function loadItems() {
  try {
    const response = await fetch('/api/items');
    if (response.status === 401) return window.location.href = '/login.html';
    if (!response.ok) throw new Error('Could not load reports.');
    const data = await response.json();
    state.items = Array.isArray(data.items) ? data.items : [];
    renderStats(); renderItems();
  } catch (error) {
    elements.summary.textContent = 'Unable to load reports';
    elements.grid.innerHTML = `<div class="empty-state"><h3>Server connection problem</h3><p>${escapeHtml(error.message)} Start the Node.js server and refresh the page.</p></div>`;
  }
}

async function updateStatus(id, status) {
  try {
    const response = await fetch(`/api/items/${encodeURIComponent(id)}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not update the report.');
    await loadItems();
  } catch (error) { window.alert(error.message); }
}

function setFormMessage(message, type = '') { elements.message.textContent = message; elements.message.className = `form-message ${type}`; }

function validateForm(formData) {
  const errors = [];
  if (!['lost', 'found'].includes(formData.type)) errors.push('Choose whether the item is lost or found.');
  if (!formData.category) errors.push('Choose a category.');
  if (formData.title.length < 3) errors.push('Item name must contain at least 3 characters.');
  if (formData.description.length < 10) errors.push('Description must contain at least 10 characters.');
  if (formData.location.length < 2) errors.push('Enter the location.');
  if (!formData.date) errors.push('Choose the date.');
  if (formData.contact.length < 5) errors.push('Enter contact information.');
  return errors;
}

elements.search.addEventListener('input', (event) => { state.filters.search = event.target.value.trim(); renderItems(); });
elements.type.addEventListener('change', (event) => { state.filters.type = event.target.value; renderItems(); });
elements.category.addEventListener('change', (event) => { state.filters.category = event.target.value; renderItems(); });
elements.status.addEventListener('change', (event) => { state.filters.status = event.target.value; renderItems(); });

elements.grid.addEventListener('click', (event) => {
  const returnButton = event.target.closest('[data-return-id]');
  const reopenButton = event.target.closest('[data-reopen-id]');
  if (returnButton) updateStatus(returnButton.dataset.returnId, 'returned');
  if (reopenButton) updateStatus(reopenButton.dataset.reopenId, 'active');
});

elements.description.addEventListener('input', () => { elements.descriptionCount.textContent = elements.description.value.length; });

elements.form.addEventListener('submit', async (event) => {
  event.preventDefault(); setFormMessage('');
  const formData = Object.fromEntries(new FormData(elements.form).entries());
  Object.keys(formData).forEach((key) => { formData[key] = formData[key].trim(); });
  const errors = validateForm(formData);
  if (errors.length) { setFormMessage(errors.join(' '), 'error'); return; }
  const submitButton = elements.form.querySelector('button[type="submit"]'); submitButton.disabled = true; submitButton.textContent = 'Saving…';
  try {
    const response = await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not save the report.');
    elements.form.reset(); elements.descriptionCount.textContent = '0'; setFormMessage('Report submitted successfully.', 'success'); await loadItems();
    document.querySelector('#browse').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { setFormMessage(error.message, 'error'); }
  finally { submitButton.disabled = false; submitButton.textContent = 'Submit Report'; }
});

elements.logout.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login.html';
});

const today = new Date();
elements.date.value = today.toISOString().slice(0, 10);

document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', () => {
  const target = document.querySelector(link.getAttribute('href'));
  if (target) target.scrollIntoView({ behavior: 'smooth' });
}));

async function startApp() {
  const response = await fetch('/api/me');
  if (!response.ok) return window.location.href = '/login.html';
  const data = await response.json();
  state.user = data.user;
  renderUser();
  loadItems();
}

startApp();
