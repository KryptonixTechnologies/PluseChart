const storagePrefix = "pulsechart";

function storageKey(key: string) {
  return `${storagePrefix}.${key}`;
}

export function readStored<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(storageKey(key));
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing or restricted environments.
  }
}
