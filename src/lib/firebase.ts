import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  get,
  child,
  onValue,
  off,
  type Unsubscribe,
} from "firebase/database";

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
const db = getDatabase(app);

export function getDbRef(path: string) {
  return ref(db, path);
}

export async function readData<T>(path: string): Promise<T | null> {
  const snapshot = await get(child(ref(db), path));
  return snapshot.exists() ? (snapshot.val() as T) : null;
}

export async function writeData(path: string, data: unknown): Promise<void> {
  await set(ref(db, path), data);
}

export function subscribeData(
  path: string,
  callback: (data: unknown) => void
): Unsubscribe {
  const dataRef = ref(db, path);
  const unsubscribe = onValue(dataRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return unsubscribe;
}

export function subscribeChildData(
  path: string,
  callback: (data: Record<string, unknown> | null) => void
): Unsubscribe {
  const dataRef = ref(db, path);
  const unsubscribe = onValue(dataRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as Record<string, unknown>) : null);
  });
  return unsubscribe;
}

export { off, ref };
