/* ============================================================
   POTTY — Track bathroom breaks for house training
   ============================================================ */
import { pottyTypes, pottyLocations } from '../data.js';
import { loadPotty, savePotty, esc, formatTime, formatDate, todayISO, nowISO } from '../storage.js';

let _init = false;

export function initPotty() {
  renderPotty();
  if (!_init) {
    _init = true;
    attachListeners();
  }
}

function renderPotty() {
  const el = document.getElementById('page-potty');
  const logs = loadPotty();
  const todayLogs = logs.filter(l => l.time && l.time.startsWith(todayISO()));
  const accidents = todayLogs.filter(l => l.type === 'accident').length;
  const successes = todayLogs.filter(l => l.type !== 'accident').length;

  el.innerHTML = `
    <div class="today-strip">
      <div class="today-stat">
        <div class="today-stat__value">${todayLogs.length}</div>
        <div class="today-stat__label">Today</div>
      </div>
      <div class="today-stat">
        <div class="today-stat__value" style="color:var(--green-600)">${successes}</div>
        <div class="today-stat__label">Good</div>
      </div>
      <div class="today-stat">
        <div class="today-stat__value" style="color:var(--red-500)">${accidents}</div>
        <div class="today-stat__label">Accidents</div>
      </div>
    </div>

    <!-- Quick log -->
    <div class="card" style="margin-bottom:var(--sp-4)">
      <h3 style="font-size:.9rem;font-weight:700;margin-bottom:var(--sp-3)">🚽 Log Potty</h3>

      <label style="font-size:.8rem;font-weight:600;color:var(--text-muted);display:block;margin-bottom:var(--sp-2)">Type</label>
      <div class="potty-type-grid" id="potty-type-grid">
        ${pottyTypes.map((t, i) => `
          <button class="potty-type-btn${i === 0 ? ' active' : ''}" data-type="${t.id}">
            <span class="potty-type-btn__icon">${t.icon}</span>
            ${t.label}
          </button>
        `).join('')}
      </div>

      <label style="font-size:.8rem;font-weight:600;color:var(--text-muted);display:block;margin-bottom:var(--sp-2)">Location</label>
      <div class="amount-grid" id="potty-location-grid">
        ${pottyLocations.map((loc, i) => `
          <button class="amount-btn${i === 0 ? ' active' : ''}" data-location="${loc}">${loc}</button>
        `).join('')}
      </div>

      <div class="form-group" style="margin-bottom:var(--sp-3)">
        <label>Notes (optional)</label>
        <input type="text" class="form-input" id="potty-notes" placeholder="e.g. After feeding">
      </div>

      <button class="btn btn--primary btn--block" id="potty-save-btn">Log Potty 🐾</button>
    </div>

    <!-- History -->
    <div class="section-header">
      <h2>Potty History</h2>
    </div>
    <div class="card" id="potty-history">
      ${renderHistory(logs)}
    </div>
  `;
}

function renderHistory(logs) {
  if (logs.length === 0) {
    return `<div class="empty-state"><div class="empty-state__icon">🐾</div><div class="empty-state__text">No potty breaks logged yet.</div></div>`;
  }

  const groups = {};
  logs.forEach(l => {
    const d = l.time ? formatDate(l.time) : 'Unknown';
    if (!groups[d]) groups[d] = [];
    groups[d].push(l);
  });

  return Object.entries(groups).map(([date, items]) => `
    <div class="date-group">
      <div class="date-group__header">${date}</div>
      ${items.map(l => {
        const type = pottyTypes.find(t => t.id === l.type) || pottyTypes[0];
        const isAccident = l.type === 'accident';
        return `
          <div class="log-entry">
            <div class="log-entry__icon" style="background:${isAccident ? 'var(--red-100)' : 'var(--green-100)'}">${type.icon}</div>
            <div class="log-entry__content">
              <div class="log-entry__title">${esc(type.label)}</div>
              <div class="log-entry__detail">${esc(l.location || '')}${l.notes ? ' · ' + esc(l.notes) : ''}</div>
            </div>
            <span class="log-entry__time">${l.time ? formatTime(l.time) : ''}</span>
            <button class="log-entry__delete" data-potty-idx="${logs.indexOf(l)}" title="Delete">&times;</button>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');
}

function attachListeners() {
  const el = document.getElementById('page-potty');
  el.addEventListener('click', e => {
    const typeBtn = e.target.closest('.potty-type-btn');
    if (typeBtn) {
      el.querySelectorAll('.potty-type-btn').forEach(b => b.classList.remove('active'));
      typeBtn.classList.add('active');
      return;
    }
    const locBtn = e.target.closest('#potty-location-grid .amount-btn');
    if (locBtn) {
      el.querySelectorAll('#potty-location-grid .amount-btn').forEach(b => b.classList.remove('active'));
      locBtn.classList.add('active');
      return;
    }
    if (e.target.closest('#potty-save-btn')) {
      savePottyEntry();
      return;
    }
    const delBtn = e.target.closest('.log-entry__delete[data-potty-idx]');
    if (delBtn) {
      const idx = parseInt(delBtn.dataset.pottyIdx, 10);
      const p = loadPotty();
      p.splice(idx, 1);
      savePotty(p);
      renderPotty();
    }
  });
}

function savePottyEntry() {
  const el = document.getElementById('page-potty');
  const type = el.querySelector('.potty-type-btn.active')?.dataset.type || 'pee';
  const location = el.querySelector('#potty-location-grid .amount-btn.active')?.dataset.location || '';
  const notes = document.getElementById('potty-notes')?.value.trim() || '';

  const logs = loadPotty();
  logs.unshift({ type, location, notes, time: nowISO() });
  savePotty(logs);
  renderPotty();
}
