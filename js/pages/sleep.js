/* ============================================================
   SLEEP — Track sleep/wake events
   ============================================================ */
import { sleepActions } from '../data.js';
import { loadSleep, saveSleep, esc, formatTime, formatDate, todayISO, nowISO } from '../storage.js';

let _init = false;

export function initSleep() {
  renderSleep();
  if (!_init) {
    _init = true;
    attachListeners();
  }
}

function renderSleep() {
  const el = document.getElementById('page-sleep');
  const logs = loadSleep();
  const todayLogs = logs.filter(l => l.time && l.time.startsWith(todayISO()));

  // Calculate nap stats
  let napCount = 0, totalSleepMins = 0;
  for (let i = 0; i < todayLogs.length; i++) {
    if (todayLogs[i].action === 'wake' && i + 1 < todayLogs.length && todayLogs[i + 1].action === 'sleep') {
      napCount++;
      const sleepTime = new Date(todayLogs[i + 1].time);
      const wakeTime = new Date(todayLogs[i].time);
      totalSleepMins += Math.round((wakeTime - sleepTime) / 60000);
    }
  }

  // Current state
  const lastEntry = logs[0];
  const isSleeping = lastEntry?.action === 'sleep';

  el.innerHTML = `
    <div class="today-strip">
      <div class="today-stat">
        <div class="today-stat__value">${isSleeping ? '😴' : '👀'}</div>
        <div class="today-stat__label">${isSleeping ? 'Sleeping' : 'Awake'}</div>
      </div>
      <div class="today-stat">
        <div class="today-stat__value">${napCount}</div>
        <div class="today-stat__label">Naps today</div>
      </div>
      <div class="today-stat">
        <div class="today-stat__value">${totalSleepMins > 0 ? Math.round(totalSleepMins / 60 * 10) / 10 + 'h' : '—'}</div>
        <div class="today-stat__label">Sleep today</div>
      </div>
    </div>

    <!-- Quick toggle -->
    <div class="card" style="margin-bottom:var(--sp-4)">
      <h3 style="font-size:.9rem;font-weight:700;margin-bottom:var(--sp-3)">💤 Log Sleep / Wake</h3>
      <div class="sleep-toggle-grid" id="sleep-toggle-grid">
        ${sleepActions.map(a => `
          <button class="sleep-toggle-btn" data-action="${a.id}">
            ${a.label}
          </button>
        `).join('')}
      </div>

      <div class="form-group" style="margin-bottom:var(--sp-3)">
        <label>Notes (optional)</label>
        <input type="text" class="form-input" id="sleep-notes" placeholder="e.g. Fell asleep on lap, restless night">
      </div>
    </div>

    <!-- Puppy sleep info -->
    <div class="card" style="margin-bottom:var(--sp-4)">
      <h3 style="font-size:.85rem;font-weight:700;margin-bottom:var(--sp-2)">💡 Puppy Sleep Facts</h3>
      <ul style="font-size:.8rem;color:var(--text-muted);padding-left:1.2em;list-style:disc">
        <li style="margin-bottom:var(--sp-1)">Puppies at 4 weeks sleep <strong>18–20 hours/day</strong></li>
        <li style="margin-bottom:var(--sp-1)">They wake frequently to feed (every 3–4 hours)</li>
        <li style="margin-bottom:var(--sp-1)">Short play bursts then crash — totally normal</li>
        <li>Keep sleeping area warm and quiet</li>
      </ul>
    </div>

    <!-- History -->
    <div class="section-header">
      <h2>Sleep Log</h2>
    </div>
    <div class="card" id="sleep-history">
      ${renderHistory(logs)}
    </div>
  `;
}

function renderHistory(logs) {
  if (logs.length === 0) {
    return `<div class="empty-state"><div class="empty-state__icon">💤</div><div class="empty-state__text">No sleep events logged yet.</div></div>`;
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
        const isSleep = l.action === 'sleep';
        return `
          <div class="log-entry">
            <div class="log-entry__icon" style="background:${isSleep ? 'var(--blue-100)' : 'var(--warm-100)'}">${isSleep ? '🌙' : '☀️'}</div>
            <div class="log-entry__content">
              <div class="log-entry__title">${isSleep ? 'Fell Asleep' : 'Woke Up'}</div>
              <div class="log-entry__detail">${l.notes ? esc(l.notes) : ''}</div>
            </div>
            <span class="log-entry__time">${l.time ? formatTime(l.time) : ''}</span>
            <button class="log-entry__delete" data-sleep-idx="${logs.indexOf(l)}" title="Delete">&times;</button>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');
}

function attachListeners() {
  const el = document.getElementById('page-sleep');
  el.addEventListener('click', e => {
    const toggleBtn = e.target.closest('.sleep-toggle-btn');
    if (toggleBtn) {
      const action = toggleBtn.dataset.action;
      const notes = document.getElementById('sleep-notes')?.value.trim() || '';
      const logs = loadSleep();
      logs.unshift({ action, notes, time: nowISO() });
      saveSleep(logs);
      renderSleep();
      return;
    }
    const delBtn = e.target.closest('.log-entry__delete[data-sleep-idx]');
    if (delBtn) {
      const idx = parseInt(delBtn.dataset.sleepIdx, 10);
      const s = loadSleep();
      s.splice(idx, 1);
      saveSleep(s);
      renderSleep();
    }
  });
}
