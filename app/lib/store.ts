import { deleteField, doc, onSnapshot, setDoc } from "firebase/firestore";
import { cloudEnabled, firestore } from "./firebase";

// ——— Код семьи ———
// Код и есть «ключ» от общего меню: кто его знает, тот видит и меняет данные.
const CODE_KEY = "menu:space";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const LOCAL_CODE = "LOCAL";

export const newCode = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const s = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
};

export const normalizeCode = (input: string) => {
  const s = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.length !== 12 || [...s].some((c) => !ALPHABET.includes(c))) return null;
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
};

const codeListeners = new Set<() => void>();
let code: string | null = null;

export const getCode = () => {
  if (code) return code;
  try {
    code = localStorage.getItem(CODE_KEY);
  } catch {}
  if (!code || (cloudEnabled && code === LOCAL_CODE)) {
    code = cloudEnabled ? newCode() : LOCAL_CODE;
    try {
      localStorage.setItem(CODE_KEY, code);
    } catch {}
  }
  return code;
};

export const getServerCode = () => null;

export const setCode = (next: string) => {
  code = next;
  try {
    localStorage.setItem(CODE_KEY, next);
  } catch {}
  codeListeners.forEach((listener) => listener());
};

export const subscribeCode = (listener: () => void) => {
  codeListeners.add(listener);
  return () => codeListeners.delete(listener);
};

// ——— Статус синхронизации ———
export type SyncStatus = "local" | "offline" | "syncing" | "synced";

const pending = new Map<symbol, boolean>();
const statusListeners = new Set<() => void>();
let status: SyncStatus = cloudEnabled ? "syncing" : "local";

const recomputeStatus = () => {
  let next: SyncStatus;
  if (!cloudEnabled) next = "local";
  else if (typeof navigator !== "undefined" && !navigator.onLine) next = "offline";
  else next = [...pending.values()].some(Boolean) ? "syncing" : "synced";
  if (next === status) return;
  status = next;
  statusListeners.forEach((listener) => listener());
};

export const getStatus = () => status;
export const getServerStatus = (): SyncStatus => (cloudEnabled ? "syncing" : "local");

export const subscribeStatus = (listener: () => void) => {
  statusListeners.add(listener);
  if (statusListeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("online", recomputeStatus);
    window.addEventListener("offline", recomputeStatus);
  }
  recomputeStatus();
  return () => {
    statusListeners.delete(listener);
  };
};

// ——— Документы ———
// path: "" — настройки семьи, "months/2026-11", "weeks/2026-11-02"
type Data = Record<string, unknown>;

const fullPath = (path: string) =>
  path ? `spaces/${getCode()}/${path}` : `spaces/${getCode()}`;

const localKey = (path: string) => `menu:doc:${fullPath(path)}`;
const localListeners = new Map<string, Set<(data: Data | undefined) => void>>();

const readLocal = (key: string): Data | undefined => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Data) : undefined;
  } catch {
    return undefined;
  }
};

const writeLocal = (key: string, data: Data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
  localListeners.get(key)?.forEach((listener) => listener(data));
};

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (!event.key) return;
    const data = readLocal(event.key);
    localListeners.get(event.key)?.forEach((listener) => listener(data));
  });
}

export const subscribeDoc = <T,>(path: string, listener: (data: T | undefined) => void) => {
  const db = firestore();
  if (!db) {
    const key = localKey(path);
    const set = localListeners.get(key) ?? new Set();
    localListeners.set(key, set);
    const cb = (data: Data | undefined) => listener(data as T | undefined);
    set.add(cb);
    listener(readLocal(key) as T | undefined);
    return () => {
      set.delete(cb);
    };
  }

  const id = Symbol(path);
  pending.set(id, true);
  recomputeStatus();
  const unsubscribe = onSnapshot(
    doc(db, fullPath(path)),
    { includeMetadataChanges: true },
    (snap) => {
      pending.set(id, snap.metadata.hasPendingWrites || snap.metadata.fromCache);
      recomputeStatus();
      listener(snap.exists() ? (snap.data() as T) : undefined);
    },
    (error) => {
      console.warn("Синхронизация", path, error);
      pending.set(id, false);
      recomputeStatus();
      listener(undefined);
    },
  );
  return () => {
    unsubscribe();
    pending.delete(id);
    recomputeStatus();
  };
};

const merge = (target: Data, changes: Data) => {
  Object.entries(changes).forEach(([key, value]) => {
    if (value === undefined) delete target[key];
    else if (value && typeof value === "object" && !Array.isArray(value)) {
      const current = target[key];
      target[key] = merge(
        current && typeof current === "object" ? { ...(current as Data) } : {},
        value as Data,
      );
    } else target[key] = value;
  });
  return target;
};

const forFirestore = (changes: Data): Data =>
  Object.fromEntries(
    Object.entries(changes).map(([key, value]) => [
      key,
      value === undefined
        ? deleteField()
        : value && typeof value === "object" && !Array.isArray(value)
          ? forFirestore(value as Data)
          : value,
    ]),
  );

// Глубокое слияние: вложенные объекты дополняются, undefined удаляет поле.
// Запись не ждём — без сети Firestore поставит её в очередь и отправит позже.
export const patchDoc = (path: string, changes: Data) => {
  const db = firestore();
  if (!db) {
    const key = localKey(path);
    writeLocal(key, merge({ ...readLocal(key) }, changes));
    return;
  }
  setDoc(doc(db, fullPath(path)), forFirestore(changes), { merge: true }).catch((error) =>
    console.warn("Не сохранилось", path, error),
  );
};

export const replaceDoc = (path: string, data: Data) => {
  const db = firestore();
  if (!db) {
    writeLocal(localKey(path), data);
    return;
  }
  setDoc(doc(db, fullPath(path)), data).catch((error) =>
    console.warn("Не сохранилось", path, error),
  );
};

export const uid = () => Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => ALPHABET[b % 32]).join("");
