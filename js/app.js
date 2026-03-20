/* ============================================================
   APP — Entry point, tab routing, Firebase auth, age display
   ============================================================ */
import { tabLabels, getPuppyAgeText } from './data.js';
import { loadPrefs, savePrefs } from './storage.js';
import { initFeeding } from './pages/feeding.js';
import { initWeight } from './pages/weight.js';
import { initPotty } from './pages/potty.js';
import { initSleep } from './pages/sleep.js';
import { initHealth } from './pages/health.js';
import { initMilestones } from './pages/milestones.js';
import { initFirebase, signIn, signOut, getUser, loadSharedData, pushAllToCloud, subscribeSharedData } from './firebase.js';

/* ── Tab Routing ────────────────────────────────────────── */
const tabBtns = document.querySelectorAll('.tab-bar__btn');
const tabPanels = document.querySelectorAll('.tab-panel');
const validTabs = ['feeding', 'weight', 'potty', 'sleep', 'health', 'milestones'];

function switchTab(tabId) {
  tabBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
  tabPanels.forEach(panel => panel.classList.toggle('active', panel.dataset.tab === tabId));

  const prefs = loadPrefs();
  prefs.lastTab = tabId;
  savePrefs(prefs);
  window.location.hash = tabId;
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function handleHash() {
  const hash = window.location.hash.replace('#', '') || loadPrefs().lastTab || 'feeding';
  switchTab(validTabs.includes(hash) ? hash : 'feeding');
}
window.addEventListener('hashchange', handleHash);

/* ── Puppy Age Badge ────────────────────────────────────── */
function updateAge() {
  const el = document.getElementById('puppy-age');
  if (el) el.textContent = getPuppyAgeText();
}

/* ── Login Gate ──────────────────────────────────────────── */
const loginGate = document.getElementById('login-gate');
const loginGateBtn = document.getElementById('login-gate-btn');
const appShell = document.getElementById('app-shell');

function showApp() {
  loginGate.classList.add('hidden');
  appShell.classList.remove('hidden');
}
function showLoginGate() {
  appShell.classList.add('hidden');
  loginGate.classList.remove('hidden');
}

/* ── Firebase Auth UI ────────────────────────────────────── */
const authBtn = document.getElementById('auth-btn');
const authAvatar = document.getElementById('auth-avatar');
const syncIndicator = document.getElementById('sync-indicator');

function updateAuthUI(user) {
  if (user) {
    authAvatar.src = user.photoURL || '';
    authAvatar.alt = user.displayName || 'User';
    authBtn.title = `Signed in as ${user.displayName || user.email}. Tap to sign out.`;
    syncIndicator.classList.remove('hidden');
  } else {
    authAvatar.src = '';
    authBtn.title = 'Account';
    syncIndicator.classList.add('hidden');
  }
}

function showSyncing() {
  syncIndicator.classList.remove('hidden');
  syncIndicator.classList.add('syncing');
}
function hideSyncing() {
  syncIndicator.classList.remove('syncing');
}

async function handleAuthStateChange(user) {
  updateAuthUI(user);
  if (user) {
    showApp();
    showSyncing();
    // Load cloud data and merge with local
    try {
      const cloudData = await loadSharedData();
      if (cloudData) {
        mergeCloudData(cloudData);
      } else {
        await pushLocalToCloud();
      }
      // Subscribe to real-time updates
      subscribeSharedData(data => {
        mergeCloudData(data);
        refreshAllPages();
      });
    } catch (err) {
      console.warn('Cloud sync error:', err.message);
    }
    hideSyncing();
    refreshAllPages();
    handleHash();
  } else {
    showLoginGate();
  }
}

function mergeCloudData(cloud) {
  // Simple merge: if cloud has data, use it (cloud = source of truth for shared app)
  const stores = ['feedings', 'weights', 'potty', 'sleep', 'health', 'milestones', 'vet-notes', 'schedule'];
  stores.forEach(name => {
    if (cloud[name] !== undefined) {
      localStorage.setItem('pt-' + name, JSON.stringify(cloud[name]));
    }
  });
}

async function pushLocalToCloud() {
  const stores = ['feedings', 'weights', 'potty', 'sleep', 'health', 'milestones', 'vet-notes', 'schedule'];
  const data = {};
  stores.forEach(name => {
    try {
      const raw = localStorage.getItem('pt-' + name);
      if (raw) data[name] = JSON.parse(raw);
    } catch { /* skip */ }
  });
  await pushAllToCloud(data);
}

// Auto-save to cloud on every local write (debounced)
let _syncTimer = null;
function schedulCloudSync() {
  if (!getUser()) return;
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => pushLocalToCloud().catch(() => {}), 2000);
}

// Monkey-patch localStorage.setItem to trigger cloud sync
const _origSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
  _origSetItem(key, value);
  if (key.startsWith('pt-')) schedulCloudSync();
};

function refreshAllPages() {
  initFeeding();
  initWeight();
  initPotty();
  initSleep();
  initHealth();
  initMilestones();
}

authBtn?.addEventListener('click', async () => {
  if (getUser()) {
    if (confirm('Sign out? You\'ll need to sign in again to use the app.')) {
      await signOut();
      updateAuthUI(null);
      showLoginGate();
    }
  }
});

loginGateBtn?.addEventListener('click', async () => {
  loginGateBtn.disabled = true;
  loginGateBtn.textContent = 'Signing in…';
  try {
    await signIn();
  } catch {
    // reset if popup was closed
  }
  loginGateBtn.disabled = false;
  loginGateBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.998 23.998 0 0 0 0 24c0 3.77.9 7.35 2.56 10.53l7.97-5.94z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.94C6.51 42.62 14.62 48 24 48z"/></svg> Sign in with Google';
});

/* ── Service Worker ─────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ── Share / Invite Modal ──────────────────────────────── */
const shareBtn = document.getElementById('share-btn');
const shareModal = document.getElementById('share-modal');
const shareModalClose = document.getElementById('share-modal-close');
const shareUrlInput = document.getElementById('share-url');
const shareCopyBtn = document.getElementById('share-copy-btn');
const shareCopiedMsg = document.getElementById('share-copied-msg');
const shareNativeBtn = document.getElementById('share-native-btn');

const APP_URL = 'https://sfmx.github.io/puppy-tracker/';

function openShareModal() {
  shareUrlInput.value = APP_URL;
  shareCopiedMsg.classList.add('hidden');
  shareModal.classList.remove('hidden');
  // Hide native share button if API not available
  if (!navigator.share) shareNativeBtn.style.display = 'none';
}

function closeShareModal() {
  shareModal.classList.add('hidden');
}

shareBtn?.addEventListener('click', openShareModal);
shareModalClose?.addEventListener('click', closeShareModal);
shareModal?.addEventListener('click', e => {
  if (e.target === shareModal) closeShareModal();
});

shareCopyBtn?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(APP_URL);
  } catch {
    // fallback
    shareUrlInput.select();
    document.execCommand('copy');
  }
  shareCopiedMsg.classList.remove('hidden');
  shareCopyBtn.textContent = 'Copied!';
  setTimeout(() => {
    shareCopiedMsg.classList.add('hidden');
    shareCopyBtn.textContent = 'Copy';
  }, 2000);
});

shareNativeBtn?.addEventListener('click', async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Ruby Puppy Tracker 🐾',
        text: 'Help me track Ruby! Open this link and sign in with Google to sync feeds, weight, sleep & more.',
        url: APP_URL
      });
    } catch { /* user cancelled */ }
  }
  closeShareModal();
});

/* ── Init ───────────────────────────────────────────────── */
async function init() {
  updateAge();
  setInterval(updateAge, 3600000);

  // Firebase must load first — app is gated behind auth
  try {
    await initFirebase(handleAuthStateChange);
  } catch (err) {
    console.warn('Firebase init failed (offline?):', err.message);
    // Still show login gate so user can retry
    showLoginGate();
  }
}

init();
