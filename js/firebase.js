/* ============================================================
   FIREBASE — Auth + Firestore real-time sync
   Uses ESM CDN imports — no build tools needed.
   
   This app uses SHARED data (not per-user) so anyone signed
   in can read/write the same puppy document.
   ============================================================ */

const FB_VERSION = '11.6.0';
const CDN = `https://www.gstatic.com/firebasejs/${FB_VERSION}`;

const firebaseConfig = {
  apiKey: "AIzaSyBQQ8BHSHCdQGvH1gYyl2QdNHsxwvnygxs",
  authDomain: "puppy-tracker-5c2e3.firebaseapp.com",
  projectId: "puppy-tracker-5c2e3",
  storageBucket: "puppy-tracker-5c2e3.firebasestorage.app",
  messagingSenderId: "115746638282",
  appId: "1:115746638282:web:a4a52df8b406092b1fa733",
  measurementId: "G-95T440S3DQ"
};

// Shared document ID — all users read/write the same puppy data
const PUPPY_DOC_ID = 'ruby';

/* ── State ────────────────────────────────────────────────── */
let app = null;
let auth = null;
let db = null;
let currentUser = null;
let onAuthChange = null;
let _modules = null;
let _initPromise = null;
let _unsubscribers = [];       // Firestore onSnapshot listeners

/* ── Lazy-load Firebase SDK ──────────────────────────────── */
async function ensureFirebase() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    const [
      { initializeApp },
      { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut: fbSignOut },
      { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, addDoc, deleteDoc, query, orderBy, enableIndexedDbPersistence }
    ] = await Promise.all([
      import(/* webpackIgnore: true */ `${CDN}/firebase-app.js`),
      import(/* webpackIgnore: true */ `${CDN}/firebase-auth.js`),
      import(/* webpackIgnore: true */ `${CDN}/firebase-firestore.js`)
    ]);

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    try { await enableIndexedDbPersistence(db); } catch { /* ok */ }

    _modules = {
      GoogleAuthProvider, signInWithPopup, fbSignOut,
      doc, setDoc, getDoc, onSnapshot,
      collection, addDoc, deleteDoc, query, orderBy
    };

    onAuthStateChanged(auth, user => {
      currentUser = user;
      if (onAuthChange) onAuthChange(user);
    });
  })();
  return _initPromise;
}

/* ── Public: Init ─────────────────────────────────────────── */
export async function initFirebase(authCallback) {
  onAuthChange = authCallback;
  await ensureFirebase();
}

/* ── Public: Auth ─────────────────────────────────────────── */
export async function signIn() {
  await ensureFirebase();
  const provider = new _modules.GoogleAuthProvider();
  try {
    await _modules.signInWithPopup(auth, provider);
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') console.error('Sign-in error:', err);
  }
}

export async function signOut() {
  await ensureFirebase();
  // Unsubscribe all listeners
  _unsubscribers.forEach(unsub => unsub());
  _unsubscribers = [];
  await _modules.fbSignOut(auth);
}

export function getUser() { return currentUser; }

/* ── Public: Shared Data (Document-based) ─────────────────── */

// Save a top-level field in the shared puppy document
export async function saveSharedField(field, value) {
  if (!db || !currentUser) return;
  const { doc, setDoc } = _modules;
  const ref = doc(db, 'puppies', PUPPY_DOC_ID);
  await setDoc(ref, { [field]: value, lastUpdated: new Date().toISOString() }, { merge: true });
}

// Load all shared data once
export async function loadSharedData() {
  if (!db || !currentUser) return null;
  const { doc, getDoc } = _modules;
  const ref = doc(db, 'puppies', PUPPY_DOC_ID);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// Subscribe to real-time changes on the shared puppy doc
export function subscribeSharedData(callback) {
  if (!db || !currentUser) return () => {};
  const { doc, onSnapshot } = _modules;
  const ref = doc(db, 'puppies', PUPPY_DOC_ID);
  const unsub = onSnapshot(ref, snap => {
    if (snap.exists()) callback(snap.data());
  });
  _unsubscribers.push(unsub);
  return unsub;
}

/* ── Public: Collection-based logs (feeding, potty, sleep) ── */

// Add a log entry to a sub-collection
export async function addLogEntry(collectionName, data) {
  if (!db || !currentUser) return null;
  const { collection, addDoc } = _modules;
  const ref = collection(db, 'puppies', PUPPY_DOC_ID, collectionName);
  const docRef = await addDoc(ref, {
    ...data,
    createdBy: currentUser.displayName || currentUser.email || 'Unknown',
    createdAt: new Date().toISOString()
  });
  return docRef.id;
}

// Delete a log entry
export async function deleteLogEntry(collectionName, docId) {
  if (!db || !currentUser) return;
  const { doc, deleteDoc } = _modules;
  const ref = doc(db, 'puppies', PUPPY_DOC_ID, collectionName, docId);
  await deleteDoc(ref);
}

// Subscribe to a collection with real-time updates
export function subscribeCollection(collectionName, callback) {
  if (!db || !currentUser) return () => {};
  const { collection, query, orderBy, onSnapshot } = _modules;
  const ref = collection(db, 'puppies', PUPPY_DOC_ID, collectionName);
  const q = query(ref, orderBy('createdAt', 'desc'));
  const unsub = onSnapshot(q, snap => {
    const items = [];
    snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
    callback(items);
  });
  _unsubscribers.push(unsub);
  return unsub;
}

/* ── Public: Push all local data to cloud ─────────────────── */
export async function pushAllToCloud(localData) {
  if (!db || !currentUser) return;
  const { doc, setDoc } = _modules;
  const ref = doc(db, 'puppies', PUPPY_DOC_ID);
  await setDoc(ref, {
    ...localData,
    lastUpdated: new Date().toISOString()
  }, { merge: true });
}
