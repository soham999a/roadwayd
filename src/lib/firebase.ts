import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  getDocs,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
  type DocumentData,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function writeDoc<T extends DocumentData>(path: string, id: string, data: T): Promise<void> {
  await setDoc(doc(db, path, id), data);
}

export { deleteDoc as deleteDoc_ };

export async function readCollection<T>(path: string): Promise<Record<string, T>> {
  const snap = await getDocs(query(collection(db, path)));
  const result: Record<string, T> = {};
  snap.forEach((d) => {
    result[d.id] = d.data() as T;
  });
  return result;
}

export function subscribeCollection<T>(
  path: string,
  callback: (data: Record<string, T>) => void
): Unsubscribe {
  const col = collection(db, path);
  return onSnapshot(col, (snap) => {
    const result: Record<string, T> = {};
    snap.forEach((d) => {
      result[d.id] = d.data() as T;
    });
    callback(result);
  });
}

export function subscribeDoc<T>(
  path: string,
  callback: (data: T | null) => void
): Unsubscribe {
  const d = doc(db, path);
  return onSnapshot(d, (snap) => {
    callback(snap.exists() ? (snap.data() as T) : null);
  });
}

export async function writeBatchData(items: Array<{ path: string; id: string; data: DocumentData }>): Promise<void> {
  const batch = writeBatch(db);
  for (const item of items) {
    batch.set(doc(db, item.path, item.id), item.data);
  }
  await batch.commit();
}

export { db };
