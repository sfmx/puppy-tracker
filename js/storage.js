/* ============================================================
   STORAGE — localStorage wrapper for offline-first data
   All data keyed by prefix 'pt-' (puppy tracker)
   ============================================================ */

const PREFIX = 'pt-';
function key(name) { return PREFIX + name; }

export function load(name, fallback = null) {
  try {
    const raw = localStorage.getItem(key(name));
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

export function save(name, value) {
  try {
    localStorage.setItem(key(name), JSON.stringify(value));
  } catch { /* quota */ }
}

export function remove(name) {
  localStorage.removeItem(key(name));
}

/* ── Convenience loaders ──────────────────────────────────── */
export function loadFeedings()  { return load('feedings', []); }
export function saveFeedings(v) { save('feedings', v); }

export function loadWeights()  { return load('weights', []); }
export function saveWeights(v) { save('weights', v); }

export function loadPotty()  { return load('potty', []); }
export function savePotty(v) { save('potty', v); }

export function loadSleep()  { return load('sleep', []); }
export function saveSleep(v) { save('sleep', v); }

export function loadHealth()  { return load('health', []); }
export function saveHealth(v) { save('health', v); }

export function loadMilestones()  { return load('milestones', {}); }
export function saveMilestones(v) { save('milestones', v); }

export function loadPrefs()  { return load('prefs', { lastTab: 'feeding' }); }
export function savePrefs(v) { save('prefs', v); }

/* ── Helpers ──────────────────────────────────────────────── */
export function esc(str) {
  const el = document.createElement('span');
  el.textContent = str || '';
  return el.innerHTML;
}

export function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(isoStr) {
  return new Date(isoStr).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function nowISO() {
  return new Date().toISOString();
}
