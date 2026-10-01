/**
 * Tiny pub/sub for the "Scheduled for…" toast. The row or input that saved
 * the item often unmounts right after (the draft closes, the item moves to
 * Upcoming), so the toast lives in the app layout and is triggered from here.
 * Plain module on purpose — see next16-client-module-value-exports.
 */

export type ScheduledToastPayload = {
  /** YYYY-MM-DD the item will surface. */
  date: string;
  /** Claude worked the date out (shows the sparkle). */
  fromAi: boolean;
  /** The user's local today, to word "today" / "tomorrow". */
  todayKey: string;
};

type Listener = (payload: ScheduledToastPayload) => void;

const listeners = new Set<Listener>();

export function showScheduledToast(payload: ScheduledToastPayload) {
  for (const listener of listeners) listener(payload);
}

export function subscribeScheduledToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
