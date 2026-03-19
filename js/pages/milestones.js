/* ============================================================
   MILESTONES — Track developmental milestones by week
   ============================================================ */
import { milestones, PUPPY, getPuppyAge } from '../data.js';
import { loadMilestones, saveMilestones, esc, formatDate, nowISO } from '../storage.js';

let _init = false;

export function initMilestones() {
  renderMilestones();
  if (!_init) {
    _init = true;
    attachListeners();
  }
}

function renderMilestones() {
  const el = document.getElementById('page-milestones');
  const completed = loadMilestones(); // { id: dateCompleted }
  const { weeks } = getPuppyAge();

  // Group by week
  const byWeek = {};
  milestones.forEach(m => {
    if (!byWeek[m.week]) byWeek[m.week] = [];
    byWeek[m.week].push(m);
  });

  const weekKeys = Object.keys(byWeek).map(Number).sort((a, b) => a - b);

  // Count stats
  const total = milestones.length;
  const done = Object.keys(completed).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  el.innerHTML = `
    <div class="section-header">
      <h2>Ruby's Milestones</h2>
      <p>Track developmental milestones — tap to mark complete.</p>
    </div>

    <div class="today-strip">
      <div class="today-stat">
        <div class="today-stat__value">${done}/${total}</div>
        <div class="today-stat__label">Completed</div>
      </div>
      <div class="today-stat">
        <div class="today-stat__value">${pct}%</div>
        <div class="today-stat__label">Progress</div>
      </div>
      <div class="today-stat">
        <div class="today-stat__value">Wk ${weeks}</div>
        <div class="today-stat__label">Current</div>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="weaning-bar" style="margin-bottom:var(--sp-6)">
      <div class="weaning-bar__fill" style="width:${pct}%"></div>
    </div>

    ${weekKeys.map(wk => {
      const items = byWeek[wk];
      const isCurrent = wk <= weeks + 1 && wk >= weeks - 1;
      return `
        <div class="milestone-week">
          <div class="milestone-week__header" style="${isCurrent ? 'color:var(--accent-dark)' : ''}">
            ${wk <= 8 ? `Week ${wk}` : `Week ${wk}+`}
            ${wk === weeks ? ' ← current' : wk === weeks + 1 ? ' ← next' : ''}
          </div>
          ${items.map(m => {
            const isDone = !!completed[m.id];
            return `
              <div class="milestone-card ${isDone ? 'done' : ''}" data-milestone-id="${m.id}">
                <div class="milestone-card__check">
                  ${isDone ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
                </div>
                <div class="milestone-card__info">
                  <div class="milestone-card__title">${m.icon} ${esc(m.label)}</div>
                  ${isDone ? `<div class="milestone-card__date">Completed ${formatDate(completed[m.id])}</div>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }).join('')}
  `;
}

function attachListeners() {
  const el = document.getElementById('page-milestones');
  el.addEventListener('click', e => {
    const card = e.target.closest('.milestone-card[data-milestone-id]');
    if (!card) return;
    const id = card.dataset.milestoneId;
    const completed = loadMilestones();
    if (completed[id]) {
      delete completed[id];
    } else {
      completed[id] = nowISO();
    }
    saveMilestones(completed);
    renderMilestones();
  });
}
