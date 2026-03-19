/* ============================================================
   HEALTH — Vet schedule, vaccinations, worming
   ============================================================ */
import { vaccinationSchedule, PUPPY, getPuppyAge } from '../data.js';
import { loadHealth, saveHealth, esc, formatDate, nowISO } from '../storage.js';

let _init = false;

export function initHealth() {
  renderHealth();
  if (!_init) {
    _init = true;
    attachListeners();
  }
}

function renderHealth() {
  const el = document.getElementById('page-health');
  const completed = loadHealth(); // array of completed item IDs
  const { weeks, days } = getPuppyAge();
  const born = new Date(PUPPY.birthday);

  el.innerHTML = `
    <div class="section-header">
      <h2>Health & Vet Schedule</h2>
      <p>Tap an item to mark it complete. Based on Ruby's birth date (22 Feb 2026).</p>
    </div>

    <!-- Upcoming -->
    <h3 style="font-size:.85rem;font-weight:700;margin-bottom:var(--sp-3);color:var(--accent-dark)">📋 Schedule</h3>

    ${vaccinationSchedule.map(item => {
      const done = completed.includes(item.id);
      const dueDate = new Date(born);
      dueDate.setDate(dueDate.getDate() + item.week * 7);
      const overdue = !done && days >= item.week * 7;
      const upcoming = !done && !overdue && days >= (item.week - 1) * 7;

      return `
        <div class="health-card ${done ? 'done' : ''}" data-health-id="${item.id}" style="${done ? 'background:var(--green-100);border-color:var(--green-500)' : overdue ? 'border-color:var(--red-500);border-left:4px solid var(--red-500)' : upcoming ? 'border-color:var(--warm-600);border-left:4px solid var(--warm-600)' : ''}">
          <div class="health-card__icon" style="background:${done ? 'var(--green-100)' : overdue ? 'var(--red-100)' : 'var(--gray-100)'}">
            ${done ? '✅' : overdue ? '⚠️' : '💉'}
          </div>
          <div class="health-card__info">
            <div class="health-card__title">${esc(item.name)}</div>
            <div class="health-card__detail">${esc(item.desc)}</div>
            <div class="health-card__detail">Due: ~${formatDate(dueDate.toISOString())} (week ${item.week})</div>
          </div>
          <div class="health-card__status" style="color:${done ? 'var(--green-600)' : overdue ? 'var(--red-500)' : upcoming ? 'var(--warm-600)' : 'var(--gray-400)'}">
            ${done ? 'Done' : overdue ? 'Overdue' : upcoming ? 'Soon' : 'Pending'}
          </div>
        </div>
      `;
    }).join('')}

    <!-- Vet notes -->
    <div class="section-header" style="margin-top:var(--sp-6)">
      <h2>Vet Notes</h2>
    </div>
    <div class="card">
      <div class="form-group" style="margin-bottom:var(--sp-3)">
        <label>Add a vet note</label>
        <input type="text" class="form-input" id="vet-note-input" placeholder="e.g. Vet checked Ruby — all good">
      </div>
      <button class="btn btn--secondary btn--block" id="vet-note-save">Add Note</button>
    </div>
    <div id="vet-notes-list" style="margin-top:var(--sp-3)">
      ${renderVetNotes()}
    </div>

    <!-- Useful info -->
    <div class="card" style="margin-top:var(--sp-4)">
      <h3 style="font-size:.85rem;font-weight:700;margin-bottom:var(--sp-2)">📍 Nearby Vets (Ormeau Hills area)</h3>
      <ul style="font-size:.8rem;color:var(--text-muted);padding-left:1.2em;list-style:disc">
        <li style="margin-bottom:var(--sp-1)">Ormeau Vet Surgery — Ormeau</li>
        <li style="margin-bottom:var(--sp-1)">Greencross Vets Coomera</li>
        <li style="margin-bottom:var(--sp-1)">Pimpama City Vet</li>
        <li>Animal Emergency Service — Carrara (24hr)</li>
      </ul>
    </div>
  `;
}

function renderVetNotes() {
  const notes = loadVetNotes();
  if (notes.length === 0) return '';
  return notes.map((n, i) => `
    <div class="card" style="padding:var(--sp-3);margin-bottom:var(--sp-2)">
      <div style="display:flex;justify-content:space-between;align-items:start">
        <div>
          <div style="font-size:.85rem;font-weight:600">${esc(n.text)}</div>
          <div style="font-size:.7rem;color:var(--gray-400)">${formatDate(n.time)}</div>
        </div>
        <button class="log-entry__delete" data-vnote-idx="${i}" title="Delete">&times;</button>
      </div>
    </div>
  `).join('');
}

function loadVetNotes() {
  try {
    const raw = localStorage.getItem('pt-vet-notes');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveVetNotes(v) {
  localStorage.setItem('pt-vet-notes', JSON.stringify(v));
}

function attachListeners() {
  const el = document.getElementById('page-health');
  el.addEventListener('click', e => {
    // Toggle health item
    const card = e.target.closest('.health-card[data-health-id]');
    if (card && !e.target.closest('button')) {
      const id = card.dataset.healthId;
      const completed = loadHealth();
      const idx = completed.indexOf(id);
      if (idx >= 0) completed.splice(idx, 1);
      else completed.push(id);
      saveHealth(completed);
      renderHealth();
      return;
    }
    // Save vet note
    if (e.target.closest('#vet-note-save')) {
      const input = document.getElementById('vet-note-input');
      const text = input.value.trim();
      if (!text) return;
      const notes = loadVetNotes();
      notes.unshift({ text, time: nowISO() });
      saveVetNotes(notes);
      input.value = '';
      document.getElementById('vet-notes-list').innerHTML = renderVetNotes();
      return;
    }
    // Delete vet note
    const delBtn = e.target.closest('.log-entry__delete[data-vnote-idx]');
    if (delBtn) {
      const idx = parseInt(delBtn.dataset.vnoteIdx, 10);
      const notes = loadVetNotes();
      notes.splice(idx, 1);
      saveVetNotes(notes);
      document.getElementById('vet-notes-list').innerHTML = renderVetNotes();
    }
  });
}
