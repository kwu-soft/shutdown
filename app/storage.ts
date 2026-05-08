export const localStorageChangedEvent = "campus-board-local-storage-changed";

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function notifyLocalStorageChanged() {
  window.dispatchEvent(new Event(localStorageChangedEvent));
}
