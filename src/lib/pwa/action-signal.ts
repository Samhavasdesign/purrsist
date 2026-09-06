/**
 * Lightweight "the user just completed something" signal.
 *
 * The Home Screen prompt listens for this and surfaces itself a beat later, at
 * a natural pause — never on load, never mid-typing. Kept as a plain module so
 * it can be imported from both client components and utilities.
 */
export const ACTION_COMPLETE_EVENT = "purrsist:action-complete";

export function notifyActionComplete(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ACTION_COMPLETE_EVENT));
}
