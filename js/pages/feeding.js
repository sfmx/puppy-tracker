/* ============================================================
   FEEDING — Log feeds, schedule reminders, full history
   ============================================================ */
import { feedTypes, feedAmounts, feeders, feedingGuide, defaultFeedSchedule, dangerousFoods, getPuppyAge, getWeaningProgress, PUPPY } from '../data.js';
import { loadFeedings, saveFeedings, loadSchedule, saveSchedule, esc, formatTime, formatDate, todayISO, nowISO, timeAgo } from '../storage.js';

let _init = false;
let _notifTimer = null;
let _lastNotifKey = ''; // prevent duplicate notifications within same minute

export function initFeeding() {
  renderFeeding();
  if (!_init) {
    _init = true;
    attachListeners();
    startNotificationChecker();
  }
}

/* ── Schedule helpers ─────────────────────────────────────── */
function getSchedule() {
  return loadSchedule() || { times: [...defaultFeedSchedule], enabled: true };
}

function saveScheduleData(sched) {
  saveSchedule(sched);
}

function nextFeedInfo(schedule, feedings) {
  if (!schedule.enabled || schedule.times.length === 0) return null;
  const now = new Date();
  const hhmm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  const sorted = [...schedule.times].sort();
  const next = sorted.find(t => t > hhmm);
  if (next) return { time: next, label: 'Today' };
  return { time: sorted[0], label: 'Tomorrow' };
}

/* ── Notification helpers ─────────────────────────────────── */
function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, icon: 'icons/icon-192.svg', badge: 'icons/favicon.svg', tag: 'feed-reminder' });
  } catch { /* mobile fallback — SW needed for push */ }
}

function startNotificationChecker() {
  // Check every 30 seconds
  _notifTimer = setInterval(() => {
    const sched = getSchedule();
    if (!sched.enabled) return;
    const now = new Date();
    const hhmm = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const key = todayISO() + '-' + hhmm;
    if (key === _lastNotifKey) return; // already fired this minute
    if (sched.times.includes(hhmm)) {
      _lastNotifKey = key;
      sendNotification(`🍽️ Time to feed ${PUPPY.name}!`, `Scheduled feed at ${formatTimeLabel(hhmm)}`);
    }
  }, 30000);
}

function formatTimeLabel(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${suffix}`;
}

/* ── Render ───────────────────────────────────────────────── */
function renderFeeding() {
  const el = document.getElementById('page-feeding');
  const feedings = loadFeedings();
  const { weeks } = getPuppyAge();
  const weanPct = getWeaningProgress();
  const guide = [...feedingGuide].reverse().find(g => g.week <= Math.max(weeks, 3)) || feedingGuide[0];
  const todayFeeds = feedings.filter(f => f.time && f.time.startsWith(todayISO()));
  const sched = getSchedule();
  const nxt = nextFeedInfo(sched, feedings);
  const notifOk = ('Notification' in window) && Notification.permission === 'granted';

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
      ${nxt ? `<div class="today-stat">
        <div class="today-stat__value">${formatTimeLabel(nxt.time)}</div>
        <div class="today-stat__label">Next feed</div>
      </div>` : ''}
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

    <!-- Current Week Food Guide -->
    <div class="card food-guide-current" style="margin-bottom:var(--sp-4);border-left:4px solid var(--accent)">
      <h3 style="font-size:.9rem;font-weight:700;margin-bottom:2px">📖 This Week's Food Guide <span class="tag tag--green">Week ${guide.week}</span></h3>
      <div style="font-size:.7rem;color:var(--text-muted);margin-bottom:var(--sp-2)">${(() => {
        const born = new Date(PUPPY.birthday);
        const idx = feedingGuide.findIndex(g => g.week === guide.week);
        const s = new Date(born); s.setDate(born.getDate() + (guide.week - 1) * 7);
        const nw = idx < feedingGuide.length - 1 ? feedingGuide[idx + 1].week : guide.week + 1;
        const e = new Date(born); e.setDate(born.getDate() + nw * 7 - 1);
        const fmt = d => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
        return fmt(s) + ' – ' + fmt(e);
      })()}</div>
      
      <div style="margin-bottom:var(--sp-3)">
        <div style="font-size:.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:var(--sp-1)">Recommended Foods</div>
        <ul style="margin:0;padding-left:var(--sp-4);font-size:.8rem;line-height:1.6">
          ${(guide.foods || []).map(f => `<li>${esc(f)}</li>`).join('')}
        </ul>
      </div>

      <div style="margin-bottom:var(--sp-3)">
        <div style="font-size:.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:var(--sp-1)">Amount</div>
        <p style="font-size:.8rem;margin:0">${esc(guide.amount || '')}</p>
      </div>

      ${guide.recipe ? `
      <div style="margin-bottom:var(--sp-3);background:var(--warm-50);padding:var(--sp-3);border-radius:var(--radius)">
        <div style="font-size:.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:var(--sp-1)">🍳 Recipe</div>
        <p style="font-size:.8rem;margin:0;line-height:1.5">${esc(guide.recipe)}</p>
      </div>` : ''}

      ${(guide.tips || []).length ? `
      <div>
        <div style="font-size:.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;margin-bottom:var(--sp-1)">💡 Tips</div>
        <ul style="margin:0;padding-left:var(--sp-4);font-size:.8rem;line-height:1.6">
          ${guide.tips.map(t => `<li>${esc(t)}</li>`).join('')}
        </ul>
      </div>` : ''}
    </div>

    <!-- Full Food Guide Timeline (collapsible) -->
    <div class="card" style="margin-bottom:var(--sp-4)">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" id="guide-toggle">
        <h3 style="font-size:.9rem;font-weight:700;margin:0">📅 Full Food Guide Timeline</h3>
        <span style="font-size:.75rem;color:var(--accent);font-weight:600" id="guide-toggle-label">Show ▼</span>
      </div>
      <div id="guide-timeline" style="display:none;margin-top:var(--sp-3)">
        ${feedingGuide.map((g, i) => {
          const isCurrent = g.week === guide.week;
          const isPast = g.week < guide.week;
          const borderColor = isCurrent ? 'var(--accent)' : isPast ? 'var(--green)' : 'var(--border)';
          const bgColor = isCurrent ? 'var(--accent-light)' : 'transparent';
          // Calculate date range for this guide entry
          const born = new Date(PUPPY.birthday);
          const startDate = new Date(born);
          startDate.setDate(born.getDate() + (g.week - 1) * 7);
          const nextWeek = i < feedingGuide.length - 1 ? feedingGuide[i + 1].week : g.week + 1;
          const endDate = new Date(born);
          endDate.setDate(born.getDate() + nextWeek * 7 - 1);
          const fmt = d => d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
          const rangeLabel = nextWeek > g.week + 1
            ? `Weeks ${g.week}–${nextWeek - 1}`
            : `Week ${g.week}`;
          return `
          <div style="border-left:3px solid ${borderColor};padding:var(--sp-3);margin-bottom:var(--sp-2);background:${bgColor};border-radius:0 var(--radius) var(--radius) 0">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
              <span style="font-size:.8rem;font-weight:700">${rangeLabel} ${isCurrent ? '← now' : isPast ? '✓' : ''}</span>
              <span style="font-size:.7rem;color:var(--text-muted)">${g.meals} meals/day</span>
            </div>
            <div style="font-size:.7rem;color:var(--text-muted);margin-bottom:var(--sp-1)">${fmt(startDate)} – ${fmt(endDate)}</div>
            <div style="font-size:.75rem;color:var(--text-secondary);margin-bottom:var(--sp-1)">${esc(g.texture)}</div>
            <div style="font-size:.75rem;color:var(--text-muted)">${esc(g.amount || '')}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <!-- Dangerous Foods (collapsible) -->
    <div class="card" style="margin-bottom:var(--sp-4);border:1px solid var(--red)">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" id="danger-toggle">
        <h3 style="font-size:.9rem;font-weight:700;margin:0;color:var(--red)">⚠️ NEVER Feed These</h3>
        <span style="font-size:.75rem;color:var(--red);font-weight:600" id="danger-toggle-label">Show ▼</span>
      </div>
      <div id="danger-foods-list" style="display:none;margin-top:var(--sp-3)">
        ${dangerousFoods.map(d => `
          <div style="display:flex;align-items:flex-start;gap:var(--sp-2);padding:var(--sp-2) 0;border-bottom:1px solid var(--border)">
            <span style="font-size:1.2rem;flex-shrink:0">${d.icon}</span>
            <div>
              <div style="font-size:.8rem;font-weight:700;color:var(--red)">${esc(d.food)}</div>
              <div style="font-size:.75rem;color:var(--text-muted)">${esc(d.why)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Feed Schedule -->
    <div class="card" style="margin-bottom:var(--sp-4)" id="schedule-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--sp-3)">
        <h3 style="font-size:.9rem;font-weight:700;margin:0">⏰ Feed Schedule</h3>
        <label class="schedule-toggle" style="display:flex;align-items:center;gap:var(--sp-2);font-size:.75rem;color:var(--text-muted);cursor:pointer">
          <input type="checkbox" id="schedule-enabled" ${sched.enabled ? 'checked' : ''} style="accent-color:var(--accent)">
          Reminders ${notifOk ? '🔔' : '🔕'}
        </label>
      </div>
      ${!notifOk && sched.enabled ? `<button class="btn btn--small" id="enable-notif-btn" style="margin-bottom:var(--sp-3);font-size:.75rem">Enable notifications 🔔</button>` : ''}
      <div class="schedule-times" id="schedule-times">
        ${sched.times.map((t, i) => `
          <div class="schedule-time-row" style="display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-2)">
            <input type="time" class="form-input schedule-time-input" value="${t}" data-sched-idx="${i}" style="flex:1;padding:var(--sp-2)">
            <button class="btn btn--small btn--danger schedule-remove" data-sched-idx="${i}" title="Remove">✕</button>
          </div>
        `).join('')}
      </div>
      <button class="btn btn--small btn--secondary" id="schedule-add-btn" style="margin-top:var(--sp-1)">+ Add time</button>
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

      <label style="font-size:.8rem;font-weight:600;color:var(--text-muted);display:block;margin-bottom:var(--sp-2)">Who fed ${PUPPY.name}?</label>
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

    <!-- Full History -->
    <div class="section-header" style="margin-top:var(--sp-6)">
      <h2>Feed History</h2>
      <span style="font-size:.75rem;color:var(--text-muted)">${feedings.length} total</span>
    </div>
    <div class="card" id="feed-history">
      ${renderHistory(feedings)}
    </div>
  `;
}

function renderHistory(feedings) {
  if (feedings.length === 0) {
    return `<div class="empty-state"><div class="empty-state__icon">🥣</div><div class="empty-state__text">No feeds logged yet. Log ${PUPPY.name}'s first feed above!</div></div>`;
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
      <div class="date-group__header">${date} <span style="font-weight:400;opacity:.6">(${items.length} feed${items.length !== 1 ? 's' : ''})</span></div>
      ${items.map((f) => {
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

/* ── Event Listeners ──────────────────────────────────────── */
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
      return;
    }
    // Enable notifications button
    if (e.target.closest('#enable-notif-btn')) {
      requestNotifPermission();
      // Re-render after a short delay to update UI
      setTimeout(renderFeeding, 500);
      return;
    }
    // Schedule remove
    const rmBtn = e.target.closest('.schedule-remove');
    if (rmBtn) {
      const idx = parseInt(rmBtn.dataset.schedIdx, 10);
      const sched = getSchedule();
      sched.times.splice(idx, 1);
      saveScheduleData(sched);
      renderFeeding();
      return;
    }
    // Schedule add
    if (e.target.closest('#schedule-add-btn')) {
      const sched = getSchedule();
      sched.times.push('12:00');
      saveScheduleData(sched);
      renderFeeding();
      return;
    }
    // Toggle food guide timeline
    if (e.target.closest('#guide-toggle')) {
      const list = document.getElementById('guide-timeline');
      const label = document.getElementById('guide-toggle-label');
      if (list) {
        const open = list.style.display !== 'none';
        list.style.display = open ? 'none' : 'block';
        label.textContent = open ? 'Show ▼' : 'Hide ▲';
      }
      return;
    }
    // Toggle danger foods
    if (e.target.closest('#danger-toggle')) {
      const list = document.getElementById('danger-foods-list');
      const label = document.getElementById('danger-toggle-label');
      if (list) {
        const open = list.style.display !== 'none';
        list.style.display = open ? 'none' : 'block';
        label.textContent = open ? 'Show ▼' : 'Hide ▲';
      }
      return;
    }
  });

  // Schedule toggle & time changes (delegate)
  el.addEventListener('change', e => {
    // Enable/disable toggle
    if (e.target.id === 'schedule-enabled') {
      const sched = getSchedule();
      sched.enabled = e.target.checked;
      saveScheduleData(sched);
      if (sched.enabled) requestNotifPermission();
      renderFeeding();
      return;
    }
    // Time input changed
    if (e.target.classList.contains('schedule-time-input')) {
      const idx = parseInt(e.target.dataset.schedIdx, 10);
      const sched = getSchedule();
      sched.times[idx] = e.target.value;
      sched.times.sort();
      saveScheduleData(sched);
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
