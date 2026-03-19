/* ============================================================
   FEEDING — Log feeds with type, amount, who fed, notes
   ============================================================ */
import { feedTypes, feedAmounts, feeders, feedingGuide, getPuppyAge, getWeaningProgress } from '../data.js';
import { loadFeedings, saveFeedings, esc, formatTime, formatDate, todayISO, nowISO } from '../storage.js';

let _init = false;

export function initFeeding() {
  renderFeeding();
  if (!_init) {
    _init = true;
    attachListeners();
  }
}

function renderFeeding() {
  const el = document.getElementById('page-feeding');
  const feedings = loadFeedings();
  const { weeks } = getPuppyAge();
  const weanPct = getWeaningProgress();
  const guide = feedingGuide.find(g => g.week <= weeks + 1) || feedingGuide[0];
  const todayFeeds = feedings.filter(f => f.time && f.time.startsWith(todayISO()));

  el.innerHTML = `
    <!-- Today summary -->
    <div class="today-strip">
      <div class="today-stat">
        <div class="today-stat__value">${todayFeeds.length}</div>
        <div class="today-stat__label">Feeds today</div>
      </div>
      <div class="today-stat">
        <div class="today-stat__value">${guide.meals}</div>
        <div class="today-stat__label">Target/day</div>
      </div>
      <div class="today-stat">
        <div class="today-stat__value">${weanPct}%</div>
        <div class="today-stat__label">Weaned</div>
      </div>
    </div>

    <!-- Weaning progress -->
    <div class="card" style="margin-bottom:var(--sp-4)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-1)">
        <span style="font-size:.8rem;font-weight:600">Weaning Progress</span>
        <span class="tag">${guide.texture}</span>
      </div>
      <div class="weaning-bar"><div class="weaning-bar__fill" style="width:${weanPct}%"></div></div>
      <p style="font-size:.75rem;color:var(--text-muted);margin-top:var(--sp-1)">💡 ${esc(guide.goal)}</p>
    </div>

    <!-- Quick log form -->
    <div class="card" id="feed-form-card">
      <h3 style="font-size:.9rem;font-weight:700;margin-bottom:var(--sp-3)">🥣 Log a Feed</h3>

      <label style="font-size:.8rem;font-weight:600;color:var(--text-muted);display:block;margin-bottom:var(--sp-2)">Type</label>
      <div class="feed-type-grid" id="feed-type-grid">
        ${feedTypes.map((t, i) => `
          <button class="feed-type-btn${i === 0 ? ' active' : ''}" data-type="${t.id}">
            <span class="feed-type-btn__icon">${t.icon}</span>
            ${esc(t.label)}
          </button>
        `).join('')}
      </div>

      <label style="font-size:.8rem;font-weight:600;color:var(--text-muted);display:block;margin-bottom:var(--sp-2)">Amount</label>
      <div class="amount-grid" id="feed-amount-grid">
        ${feedAmounts.map((a, i) => `
          <button class="amount-btn${i === 1 ? ' active' : ''}" data-amount="${a}">${a}</button>
        `).join('')}
      </div>

      <label style="font-size:.8rem;font-weight:600;color:var(--text-muted);display:block;margin-bottom:var(--sp-2)">Who fed Ruby?</label>
      <div class="who-grid" id="feed-who-grid">
        ${feeders.map((f, i) => `
          <button class="who-btn${i === 0 ? ' active' : ''}" data-who="${f}">${f}</button>
        `).join('')}
      </div>

      <div class="form-group" style="margin-bottom:var(--sp-3)">
        <label>Notes (optional)</label>
        <input type="text" class="form-input" id="feed-notes" placeholder="e.g. Ate well, messy paws 🐾">
      </div>

      <button class="btn btn--primary btn--block" id="feed-save-btn">Save Feed 🍽️</button>
    </div>

    <!-- History -->
    <div class="section-header" style="margin-top:var(--sp-6)">
      <h2>Recent Feeds</h2>
    </div>
    <div class="card" id="feed-history">
      ${renderHistory(feedings)}
    </div>
  `;
}

function renderHistory(feedings) {
  if (feedings.length === 0) {
    return `<div class="empty-state"><div class="empty-state__icon">🥣</div><div class="empty-state__text">No feeds logged yet. Log Ruby's first feed above!</div></div>`;
  }

  // Group by date
  const groups = {};
  feedings.forEach(f => {
    const d = f.time ? formatDate(f.time) : 'Unknown';
    if (!groups[d]) groups[d] = [];
    groups[d].push(f);
  });

  return Object.entries(groups).map(([date, items]) => `
    <div class="date-group">
      <div class="date-group__header">${date}</div>
      ${items.map((f, i) => {
        const type = feedTypes.find(t => t.id === f.type) || feedTypes[0];
        return `
          <div class="log-entry">
            <div class="log-entry__icon" style="background:var(--accent-light)">${type.icon}</div>
            <div class="log-entry__content">
              <div class="log-entry__title">${esc(type.label)} — ${esc(f.amount || '?')}</div>
              <div class="log-entry__detail">${esc(f.who || '')}${f.notes ? ' · ' + esc(f.notes) : ''}</div>
            </div>
            <span class="log-entry__time">${f.time ? formatTime(f.time) : ''}</span>
            <button class="log-entry__delete" data-feed-idx="${feedings.indexOf(f)}" title="Delete">&times;</button>
          </div>
        `;
      }).join('')}
    </div>
  `).join('');
}

function attachListeners() {
  const el = document.getElementById('page-feeding');

  el.addEventListener('click', e => {
    // Feed type buttons
    const typeBtn = e.target.closest('.feed-type-btn');
    if (typeBtn) {
      el.querySelectorAll('.feed-type-btn').forEach(b => b.classList.remove('active'));
      typeBtn.classList.add('active');
      return;
    }
    // Amount buttons
    const amtBtn = e.target.closest('.amount-btn');
    if (amtBtn) {
      el.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('active'));
      amtBtn.classList.add('active');
      return;
    }
    // Who buttons
    const whoBtn = e.target.closest('.who-btn');
    if (whoBtn) {
      el.querySelectorAll('.who-btn').forEach(b => b.classList.remove('active'));
      whoBtn.classList.add('active');
      return;
    }
    // Save feed
    if (e.target.closest('#feed-save-btn')) {
      saveFeed();
      return;
    }
    // Delete entry
    const delBtn = e.target.closest('.log-entry__delete[data-feed-idx]');
    if (delBtn) {
      const idx = parseInt(delBtn.dataset.feedIdx, 10);
      const feeds = loadFeedings();
      feeds.splice(idx, 1);
      saveFeedings(feeds);
      renderFeeding();
    }
  });
}

function saveFeed() {
  const el = document.getElementById('page-feeding');
  const type = el.querySelector('.feed-type-btn.active')?.dataset.type || 'mush';
  const amount = el.querySelector('.amount-btn.active')?.dataset.amount || '';
  const who = el.querySelector('.who-btn.active')?.dataset.who || '';
  const notes = document.getElementById('feed-notes')?.value.trim() || '';

  const feeds = loadFeedings();
  feeds.unshift({ type, amount, who, notes, time: nowISO() });
  saveFeedings(feeds);
  renderFeeding();
}
