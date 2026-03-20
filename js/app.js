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

/* ── Firebase Auth UI ────────────────────────────────────── */
const authBtn = document.getElementById('auth-btn');
const authIcon = document.getElementById('auth-icon');
const authAvatar = document.getElementById('auth-avatar');
const syncIndicator = document.getElementById('sync-indicator');

function updateAuthUI(user) {
  if (user) {
    authIcon.classList.add('hidden');
    authAvatar.classList.remove('hidden');
    authAvatar.src = user.photoURL || '';
    authAvatar.alt = user.displayName || 'User';
    authBtn.title = `Signed in as ${user.displayName || user.email}. Tap to sign out.`;
    syncIndicator.classList.remove('hidden');
  } else {
    authIcon.classList.remove('hidden');
    authAvatar.classList.add('hidden');
    authAvatar.src = '';
    authBtn.title = 'Sign in to sync';
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
    showSyncing();
    // Load cloud data and merge with local
    try {
      const cloudData = await loadSharedData();
      if (cloudData) {
        // Merge: cloud data takes precedence for arrays (concat+dedup by time)
        mergeCloudData(cloudData);
      } else {
        // First sign-in: push local data to cloud
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
    if (confirm('Sign out? Data stays on this device but won\'t sync.')) {
      await signOut();
      updateAuthUI(null);
    }
  } else {
    await signIn();
  }
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
  // Update age every hour
  setInterval(updateAge, 3600000);

  initFeeding();
  initWeight();
  initPotty();
  initSleep();
  initHealth();
  initMilestones();
  handleHash();

  // Firebase (non-blocking)
  initFirebase(handleAuthStateChange).catch(err => {
    console.warn('Firebase init failed (offline?):', err.message);
  });
}

init();
