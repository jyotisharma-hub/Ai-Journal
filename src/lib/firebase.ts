import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  deleteDoc,
  onSnapshot,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JournalEntry, UserProfile } from '../types';
import { stripUndefined } from '../utils/sanitize';

// 1. Initialize Firebase App (Singleton guard)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 3. Cloud Firestore (Bound to configured database)
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// -----------------------------------------------------------
// Sandbox & Local Storage Fallback Helpers (For Demo Sandbox)
// -----------------------------------------------------------

const LOCAL_STORAGE_PREFIX = 'prod_sec_journal_entries_';

function getLocalSandboxEntries(userId: string): JournalEntry[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Local sandbox storage read notice:', e);
  }
  return [];
}

function saveLocalSandboxEntries(userId: string, entries: JournalEntry[]): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${userId}`, JSON.stringify(entries));
  } catch (e) {
    console.warn('Local sandbox storage write notice:', e);
  }
}

// -----------------------------------------------------------
// Authentication Helpers
// -----------------------------------------------------------

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Record user profile in Firestore
    await syncUserProfile(user);
    return user;
  } catch (error: any) {
    console.error('Firebase Google Sign-In Error:', error);
    throw error;
  }
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      syncUserProfile(user).catch((err) => {
        console.warn('Profile sync notice:', err?.message || err);
      });
    }
    callback(user);
  });
}

// -----------------------------------------------------------
// User Profile Operations
// -----------------------------------------------------------

export async function syncUserProfile(user: User): Promise<UserProfile> {
  const profile: UserProfile = {
    userId: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Reflective Mind',
    email: user.email || '',
    photoURL: user.photoURL || undefined,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  };

  if (!auth.currentUser || auth.currentUser.uid !== user.uid) {
    return profile;
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const existingData = userSnap.exists() ? userSnap.data() : null;
    
    if (existingData?.createdAt) {
      profile.createdAt = existingData.createdAt;
    }

    await setDoc(userRef, stripUndefined(profile), { merge: true });
  } catch (err: any) {
    console.warn('Firestore user profile sync warning:', err?.message || err);
  }

  return profile;
}

// -----------------------------------------------------------
// User-Isolated Firestore Entry Operations
// -----------------------------------------------------------

/**
 * Saves or updates a journal reflection entry in the user's isolated subcollection:
 * Path: /users/{userId}/entries/{entryId}
 */
export async function saveJournalEntry(userId: string, entry: JournalEntry): Promise<void> {
  if (!userId) {
    throw new Error('Missing authenticated userId for entry persistence.');
  }

  const cleanEntry = stripUndefined({
    ...entry,
    userId,
    updatedAt: new Date().toISOString()
  });

  // If Firebase Auth is authenticated and matches userId, persist to Cloud Firestore
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const entryRef = doc(db, 'users', userId, 'entries', entry.id);
      await setDoc(entryRef, cleanEntry, { merge: true });
      return;
    } catch (err: any) {
      console.warn('Firestore save notice, writing to local sandbox buffer:', err?.message);
    }
  }

  // Fallback to Sandbox storage for demo mode or during offline transitions
  const existing = getLocalSandboxEntries(userId);
  const idx = existing.findIndex(e => e.id === entry.id);
  if (idx >= 0) {
    existing[idx] = cleanEntry;
  } else {
    existing.unshift(cleanEntry);
  }
  saveLocalSandboxEntries(userId, existing);
}

/**
 * Deletes an entry from the user's isolated subcollection
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;

  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const entryRef = doc(db, 'users', userId, 'entries', entryId);
      await deleteDoc(entryRef);
      return;
    } catch (err: any) {
      console.warn('Firestore delete notice, updating local sandbox:', err?.message);
    }
  }

  const existing = getLocalSandboxEntries(userId);
  const updated = existing.filter(e => e.id !== entryId);
  saveLocalSandboxEntries(userId, updated);
}

/**
 * Subscribes to real-time updates for a user's isolated entries
 */
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (error: Error) => void
) {
  if (!userId) {
    onUpdate([]);
    return () => {};
  }

  // Check if authenticated with Firebase Auth
  const isAuthUser = auth.currentUser && auth.currentUser.uid === userId;

  if (isAuthUser) {
    try {
      const entriesRef = collection(db, 'users', userId, 'entries');
      const q = query(entriesRef, orderBy('updatedAt', 'desc'));

      return onSnapshot(
        q,
        (snapshot) => {
          const entries: JournalEntry[] = [];
          snapshot.forEach((doc) => {
            entries.push(doc.data() as JournalEntry);
          });
          onUpdate(entries);
        },
        (error) => {
          // If Firestore permission denied occurs, gracefully fall back to sandbox storage
          console.warn('Firestore subscription notice (falling back to sandbox buffer):', error?.message || error);
          const localEntries = getLocalSandboxEntries(userId);
          onUpdate(localEntries);
          if (onError) onError(error);
        }
      );
    } catch (err: any) {
      console.warn('Firestore init error, using sandbox buffer:', err?.message || err);
      const localEntries = getLocalSandboxEntries(userId);
      onUpdate(localEntries);
      return () => {};
    }
  }

  // Demo / Sandbox user: Read from local sandbox storage
  const localEntries = getLocalSandboxEntries(userId);
  onUpdate(localEntries);

  // Simple window storage listener for cross-tab or sandbox synchronization
  const handleStorage = (e: StorageEvent) => {
    if (e.key === `${LOCAL_STORAGE_PREFIX}${userId}`) {
      onUpdate(getLocalSandboxEntries(userId));
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}

/**
 * Fetch all entries once
 */
export async function fetchUserEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];

  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const entriesRef = collection(db, 'users', userId, 'entries');
      const q = query(entriesRef, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const entries: JournalEntry[] = [];
      snapshot.forEach((doc) => {
        entries.push(doc.data() as JournalEntry);
      });
      return entries;
    } catch (err: any) {
      console.warn('Firestore fetch notice, using local sandbox:', err?.message);
    }
  }

  return getLocalSandboxEntries(userId);
}
