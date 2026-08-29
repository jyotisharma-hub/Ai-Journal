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
      syncUserProfile(user).catch(console.error);
    }
    callback(user);
  });
}

// -----------------------------------------------------------
// User Profile Operations
// -----------------------------------------------------------

export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();
  
  const userSnap = await getDoc(userRef);
  const existingData = userSnap.exists() ? userSnap.data() : null;

  const profile: UserProfile = {
    userId: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Reflective Mind',
    email: user.email || '',
    photoURL: user.photoURL || undefined,
    createdAt: existingData?.createdAt || now,
    lastLoginAt: now
  };

  await setDoc(userRef, stripUndefined(profile), { merge: true });
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
    throw new Error('Missing authenticated userId for Firestore entry persistence.');
  }

  const cleanEntry = stripUndefined({
    ...entry,
    userId,
    updatedAt: new Date().toISOString()
  });

  const entryRef = doc(db, 'users', userId, 'entries', entry.id);
  await setDoc(entryRef, cleanEntry, { merge: true });
}

/**
 * Deletes an entry from the user's isolated subcollection
 */
export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;
  const entryRef = doc(db, 'users', userId, 'entries', entryId);
  await deleteDoc(entryRef);
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
      console.error('Firestore entries subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Fetch all entries once
 */
export async function fetchUserEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];
  const entriesRef = collection(db, 'users', userId, 'entries');
  const q = query(entriesRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  
  const entries: JournalEntry[] = [];
  snapshot.forEach((doc) => {
    entries.push(doc.data() as JournalEntry);
  });
  return entries;
}
