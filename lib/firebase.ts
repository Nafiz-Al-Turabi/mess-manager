import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import {
  CloudMessRecordPayload,
  JoinRequestItem,
  MessDirectoryDoc,
} from './types';
import { ADMIN_EMAIL, DEFAULT_MANAGER_PIN, DEFAULT_MESS_ID } from './accounting';

import firebaseAppletConfig from '../firebase-applet-config.json';

export const FIREBASE_CONFIG = {
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    firebaseAppletConfig.projectId ||
    'gen-lang-client-0089843448',
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    firebaseAppletConfig.appId ||
    '1:367237863098:web:e25f16519d6445c3881483',
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    firebaseAppletConfig.apiKey ||
    'AIzaSyAI6ybJtPzL8EOxSBTYNjdHtU49Zqt1_Ng',
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    firebaseAppletConfig.authDomain ||
    'gen-lang-client-0089843448.firebaseapp.com',
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    firebaseAppletConfig.storageBucket ||
    'gen-lang-client-0089843448.firebasestorage.app',
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    firebaseAppletConfig.messagingSenderId ||
    '367237863098',
};

export const FIRESTORE_DATABASE_ID =
  process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID ||
  firebaseAppletConfig.firestoreDatabaseId ||
  'ai-studio-android-messmana-bb491f10-7606-470e-a62e-a2a619841470';

export const AUTHORIZED_DOMAINS_LIST = [
  'mess-manager-wheat.vercel.app',
  'localhost',
  '127.0.0.1',
  'ais-dev-awufxscz7ak45nnwkbdlok-574574524069.asia-east1.run.app',
  'ais-pre-awufxscz7ak45nnwkbdlok-574574524069.asia-east1.run.app',
];

const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
export const auth = getAuth(app);
export const db = getFirestore(app, FIRESTORE_DATABASE_ID);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Cache of existing createdAt timestamps by collection/docId so updates always preserve createdAt
const createdAtCache = new Map<string, unknown>();

export function cacheCreatedAt(collectionName: string, docId: string, createdAtVal: unknown) {
  if (createdAtVal) {
    createdAtCache.set(`${collectionName}/${docId}`, createdAtVal);
  }
}

async function resolveCreatedAt(collectionName: string, docId: string): Promise<unknown> {
  const key = `${collectionName}/${docId}`;
  if (createdAtCache.has(key)) {
    return createdAtCache.get(key);
  }
  try {
    const snap = await getDoc(doc(db, collectionName, docId));
    if (snap.exists() && snap.data()?.createdAt) {
      const existing = snap.data().createdAt;
      createdAtCache.set(key, existing);
      return existing;
    }
  } catch {
    // Ignore read error when creating new doc
  }
  return serverTimestamp();
}

export async function signInWithGooglePopup(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithGoogleRedirectFallback(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

export async function checkGoogleRedirectResult(): Promise<User | null> {
  try {
    const res = await getRedirectResult(auth);
    return res?.user || null;
  } catch {
    return null;
  }
}

export async function signInOrRegisterWithEmail(
  email: string,
  password: string,
  displayName?: string
): Promise<User> {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    return res.user;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    if (
      code === 'auth/user-not-found' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/invalid-login-credentials'
    ) {
      const created = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && created.user) {
        await updateProfile(created.user, { displayName });
      }
      return created.user;
    }
    throw err;
  }
}

export async function signInAnonymousCloud(): Promise<User> {
  const res = await signInAnonymously(auth);
  return res.user;
}

export async function signOutFirebase(): Promise<void> {
  await fbSignOut(auth);
}

export { onAuthStateChanged };
export type { User };

/**
 * Upsert mess_directory/{messId} strictly matching the 8 required fields
 */
export async function upsertMessDirectoryDoc(
  payload: Omit<MessDirectoryDoc, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const cleanMessId = (payload.messId || DEFAULT_MESS_ID).trim().slice(0, 40);
  const cleanMessName = (payload.messName || cleanMessId).trim().slice(0, 40);
  const cleanPin = (payload.managerPin || DEFAULT_MANAGER_PIN).trim().slice(0, 12);
  const safePin = cleanPin.length >= 4 ? cleanPin : DEFAULT_MANAGER_PIN;

  const managerUids = Array.from(new Set(payload.managerUids.filter(Boolean))).slice(0, 50);
  const memberUids = Array.from(
    new Set([...managerUids, ...payload.memberUids.filter(Boolean)])
  ).slice(0, 50);
  const lockedDates = Array.from(new Set(payload.lockedDates.filter(Boolean))).slice(0, 500);

  const createdAt = await resolveCreatedAt('mess_directory', cleanMessId);

  const exactDoc = {
    messId: cleanMessId,
    messName: cleanMessName,
    managerPin: safePin,
    managerUids,
    memberUids,
    lockedDates,
    createdAt,
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'mess_directory', cleanMessId), exactDoc);
}

/**
 * Ensure the signed-in user is registered in mess_directory/{messId}
 */
export async function ensureUserInMessDirectory(
  user: User,
  messId: string,
  defaultMessName: string,
  defaultPin: string,
  currentLockedDates: string[]
): Promise<MessDirectoryDoc | null> {
  const cleanMessId = (messId || DEFAULT_MESS_ID).trim().slice(0, 40);
  const ref = doc(db, 'mess_directory', cleanMessId);
  const isSuperAdmin =
    (user.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase();

  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as MessDirectoryDoc;
      cacheCreatedAt('mess_directory', cleanMessId, data.createdAt);
      const existingManagers = Array.isArray(data.managerUids) ? data.managerUids : [];
      const existingMembers = Array.isArray(data.memberUids) ? data.memberUids : [];

      const nextManagers =
        isSuperAdmin && !existingManagers.includes(user.uid)
          ? [...existingManagers, user.uid]
          : existingManagers.length === 0
            ? [user.uid]
            : existingManagers;

      const nextMembers = !existingMembers.includes(user.uid)
        ? [...existingMembers, user.uid]
        : existingMembers;

      if (
        nextManagers.length !== existingManagers.length ||
        nextMembers.length !== existingMembers.length
      ) {
        await upsertMessDirectoryDoc({
          messId: cleanMessId,
          messName: data.messName || defaultMessName || cleanMessId,
          managerPin: data.managerPin || defaultPin || DEFAULT_MANAGER_PIN,
          managerUids: nextManagers,
          memberUids: nextMembers,
          lockedDates: Array.isArray(data.lockedDates)
            ? data.lockedDates
            : currentLockedDates,
        });
      }
      return {
        ...data,
        managerUids: nextManagers,
        memberUids: nextMembers,
      };
    } else {
      const initialDoc: Omit<MessDirectoryDoc, 'createdAt' | 'updatedAt'> = {
        messId: cleanMessId,
        messName: defaultMessName || cleanMessId,
        managerPin: defaultPin || DEFAULT_MANAGER_PIN,
        managerUids: [user.uid],
        memberUids: [user.uid],
        lockedDates: currentLockedDates,
      };
      await upsertMessDirectoryDoc(initialDoc);
      return initialDoc;
    }
  } catch (err) {
    console.warn('Could not auto-join mess_directory:', err);
    return null;
  }
}

/**
 * Upsert a single mess_records/{recordId} document with all 20 mandatory fields
 */
export async function upsertCloudMessRecord(
  payload: CloudMessRecordPayload
): Promise<void> {
  const createdAt = await resolveCreatedAt('mess_records', payload.recordId);

  const safeTitle = (payload.title || '-').trim().slice(0, 200) || '-';
  const safeSubtitle = (payload.subtitle || '').slice(0, 500);
  const safeRole = (payload.role || '').slice(0, 40);
  const safeLinkedUid = (payload.linkedUid || '').slice(0, 128);

  const exactRecord = {
    recordId: payload.recordId,
    messId: payload.messId,
    recordType: payload.recordType,
    monthKey: payload.monthKey,
    title: safeTitle,
    subtitle: safeSubtitle,
    role: safeRole,
    linkedUid: safeLinkedUid,
    entityLocalId: Math.max(0, Math.floor(Number(payload.entityLocalId) || 0)),
    targetMemberId: Math.max(0, Math.floor(Number(payload.targetMemberId) || 0)),
    amount: Math.max(0, Number(payload.amount) || 0),
    breakfast: Math.max(0, Number(payload.breakfast) || 0),
    lunch: Math.max(0, Number(payload.lunch) || 0),
    dinner: Math.max(0, Number(payload.dinner) || 0),
    guestMeal: Math.max(0, Number(payload.guestMeal) || 0),
    active: Boolean(payload.active),
    memberUids: payload.memberUids,
    managerUids: payload.managerUids,
    createdBy: payload.createdBy,
    createdAt,
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'mess_records', payload.recordId), exactRecord);
}

export async function deleteCloudMessRecord(recordId: string): Promise<void> {
  await deleteDoc(doc(db, 'mess_records', recordId));
}

/**
 * Submit or update a join_requests/{userId} document with exact 8 fields
 */
export async function upsertJoinRequest(
  payload: Omit<JoinRequestItem, 'createdAt' | 'updatedAt'>
): Promise<void> {
  const createdAt = await resolveCreatedAt('join_requests', payload.userId);
  const exactDoc = {
    userId: payload.userId,
    userName: (payload.userName || 'Member').trim().slice(0, 100) || 'Member',
    userEmail: (payload.userEmail || '').trim().slice(0, 150),
    messId: (payload.messId || DEFAULT_MESS_ID).trim().slice(0, 40),
    status: payload.status,
    managerUids: payload.managerUids,
    createdAt,
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'join_requests', payload.userId), exactDoc);
}

/**
 * Subscribe to mess_directory/{messId}
 */
export function subscribeMessDirectory(
  messId: string,
  onUpdate: (docData: MessDirectoryDoc | null) => void
): () => void {
  const cleanMessId = (messId || DEFAULT_MESS_ID).trim().slice(0, 40);
  return onSnapshot(
    doc(db, 'mess_directory', cleanMessId),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as MessDirectoryDoc;
        cacheCreatedAt('mess_directory', cleanMessId, data.createdAt);
        onUpdate(data);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('mess_directory listener notice:', err.message);
    }
  );
}

/**
 * Subscribe to mess_records where("memberUids", "array-contains", currentUser.uid)
 * and filter client-side by record.messId === activeMessCode
 */
export function subscribeMessRecords(
  currentUid: string,
  activeMessCode: string,
  onRecords: (records: CloudMessRecordPayload[]) => void
): () => void {
  const q = query(
    collection(db, 'mess_records'),
    where('memberUids', 'array-contains', currentUid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const matched: CloudMessRecordPayload[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as CloudMessRecordPayload & {
          createdAt?: Timestamp;
        };
        cacheCreatedAt('mess_records', docSnap.id, data.createdAt);
        if (data.messId === activeMessCode) {
          matched.push(data);
        }
      });
      onRecords(matched);
    },
    (err) => {
      console.warn('mess_records listener notice:', err.message);
    }
  );
}

/**
 * Subscribe to join_requests for managers
 */
export function subscribeJoinRequests(
  currentUid: string,
  activeMessCode: string,
  onRequests: (requests: JoinRequestItem[]) => void
): () => void {
  const q = query(
    collection(db, 'join_requests'),
    where('managerUids', 'array-contains', currentUid)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: JoinRequestItem[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as JoinRequestItem;
        cacheCreatedAt('join_requests', docSnap.id, data.createdAt);
        if (data.messId === activeMessCode) {
          list.push(data);
        }
      });
      onRequests(list);
    },
    (err) => {
      console.warn('join_requests listener notice:', err.message);
    }
  );
}
