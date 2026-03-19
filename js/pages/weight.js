/* ============================================================
   WEIGHT — Track puppy weight with simple bar chart
   ============================================================ */
import { loadWeights, saveWeights, esc, formatDate, nowISO } from '../storage.js';
import { getPuppyAgeText } from '../data.js';

let _init = false;

export function initWeight() {
  renderWeight();
  if (!_init) {
    _init = true;
    attachListeners();
  }
}

function renderWeight() {
  const el = document.getElementById('page-weight');
  const weights = loadWeights();
  const latest = weights[0];

  // Expected weight: Maltese Shih Tzu ~200-350g at 4 weeks, ~1-2kg at 8 weeks
  el.innerHTML = `
    <div class="section-header">
      <h2>Weight Tracker</h2>
      <p>Track Ruby's growth — weigh at the same time each day if possible.</p>
    </div>

    ${latest ? `
      <div class="today-strip">
        <div class="today-stat">
          <div class="today-stat__value">${latest.grams}g</div>
          <div class="today-stat__label">Latest</div>
        </div>
        <div class="today-stat">
          <div class="today-stat__value">${weights.length > 1 ? `+${latest.grams - weights[1].grams}g` : '—'}</div>
          <div class="today-stat__label">Change</div>
        </div>
        <div class="today-stat">
          <div class="today-stat__value">${weights.length}</div>
          <div class="today-stat__label">Records</div>
        </div>
      </div>
    ` : ''}

    <!-- Chart -->
    ${weights.length > 1 ? `
      <div class="card" style="margin-bottom:var(--sp-4)">
        <h3 style="font-size:.85rem;font-weight:700;margin-bottom:var(--sp-3)">Growth Chart</h3>
        <div class="weight-chart" style="margin-bottom:20px">
          ${renderChart(weights)}
        </div>
      </div>
    ` : ''}

    <!-- Log weight -->
    <div class="card" style="margin-bottom:var(--sp-4)">
      <h3 style="font-size:.9rem;font-weight:700;margin-bottom:var(--sp-3)">⚖️ Log Weight</h3>
      <div class="form-group">
        <label>Weight in grams</label>
        <input type="number" class="form-input" id="weight-input" placeholder="e.g. 350" min="50" max="10000" step="5">
      </div>
      <div class="form-group" style="margin-bottom:var(--sp-3)">
        <label>Notes (optional)</label>
        <input type="text" class="form-input" id="weight-notes" placeholder="e.g. After morning feed">
      </div>
      <button class="btn btn--primary btn--block" id="weight-save-btn">Save Weight ⚖️</button>
    </div>

    <!-- Expected ranges info -->
    <div class="card" style="margin-bottom:var(--sp-4)">
      <h3 style="font-size:.85rem;font-weight:700;margin-bottom:var(--sp-2)">📊 Expected Ranges (Maltese Shih Tzu)</h3>
      <div style="font-size:.8rem;color:var(--text-muted)">
        <div style="display:flex;justify-content:space-between;padding:var(--sp-1) 0;border-bottom:1px solid var(--gray-100)"><span>4 weeks</span><strong>250–400g</strong></div>
        <div style="display:flex;justify-content:space-between;padding:var(--sp-1) 0;border-bottom:1px solid var(--gray-100)"><span>6 weeks</span><strong>400–700g</strong></div>
        <div style="display:flex;justify-content:space-between;padding:var(--sp-1) 0;border-bottom:1px solid var(--gray-100)"><span>8 weeks</span><strong>600–1200g</strong></div>
        <div style="display:flex;justify-content:space-between;padding:var(--sp-1) 0"><span>12 weeks</span><strong>1.0–2.0kg</strong></div>
      </div>
    </div>

    <!-- History -->
    <div class="section-header">
      <h2>Weight History</h2>
    </div>
    <div class="card" id="weight-history">
      ${renderHistory(weights)}
    </div>
  `;
}

function renderChart(weights) {
  // Show last 10, oldest first
  const data = weights.slice(0, 10).reverse();
  const max = Math.max(...data.map(w => w.grams));
  const min = Math.min(...data.map(w => w.grams));
  const range = max - min || 1;

  return data.map(w => {
    const pct = 20 + ((w.grams - min) / range) * 70; // 20–90% height
    return `
      <div class="weight-bar" style="height:${pct}%">
        <span class="weight-bar__label">${w.grams}g</span>
        <span class="weight-bar__date">${formatDate(w.time)}</span>
      </div>
    `;
  }).join('');
}

function renderHistory(weights) {
  if (weights.length === 0) {
    return `<div class="empty-state"><div class="empty-state__icon">⚖️</div><div class="empty-state__text">No weights recorded yet. Weigh Ruby and log it above!</div></div>`;
  }
  return weights.map((w, i) => `
    <div class="log-entry">
      <div class="log-entry__icon" style="background:var(--warm-100)">⚖️</div>
      <div class="log-entry__content">
        <div class="log-entry__title">${w.grams}g${i < weights.length - 1 ? ` (${w.grams >= weights[i+1].grams ? '+' : ''}${w.grams - weights[i+1].grams}g)` : ''}</div>
        <div class="log-entry__detail">${w.notes ? esc(w.notes) : ''}</div>
      </div>
      <span class="log-entry__time">${formatDate(w.time)}</span>
      <button class="log-entry__delete" data-weight-idx="${i}" title="Delete">&times;</button>
    </div>
  `).join('');
}

function attachListeners() {
  const el = document.getElementById('page-weight');
  el.addEventListener('click', e => {
    if (e.target.closest('#weight-save-btn')) {
      saveWeight();
      return;
    }
    const delBtn = e.target.closest('.log-entry__delete[data-weight-idx]');
    if (delBtn) {
      const idx = parseInt(delBtn.dataset.weightIdx, 10);
      const w = loadWeights();
      w.splice(idx, 1);
      saveWeights(w);
      renderWeight();
    }
  });
}

function saveWeight() {
  const input = document.getElementById('weight-input');
  const grams = parseInt(input.value, 10);
  if (!grams || grams < 50) { input.focus(); return; }
  const notes = document.getElementById('weight-notes')?.value.trim() || '';

  const weights = loadWeights();
  weights.unshift({ grams, notes, time: nowISO() });
  saveWeights(weights);
  renderWeight();
}
