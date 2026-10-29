import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

// Ключи веб-приложения Firebase не секретные: доступ ограничивают правила firestore.rules
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const cloudEnabled = Boolean(config.apiKey && config.projectId);

let db: Firestore | null = null;

export const firestore = () => {
  if (!cloudEnabled || typeof window === "undefined") return null;
  db ??= initializeFirestore(initializeApp(config), {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  return db;
};
