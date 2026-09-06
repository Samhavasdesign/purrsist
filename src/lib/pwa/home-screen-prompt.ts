/**
 * Eligibility + dismissal logic for the "Add to Home Screen" prompt.
 *
 * Pure and DOM-free so it can be unit-tested without a browser: the component
 * gathers device / storage values and passes them in. The only things persisted
 * are date keys for the days Purrsist was opened and a single dismissal
 * timestamp — no additional personal data is collected.
 */

export const ACTIVE_DAYS_KEY = "purrsist:a2hs:active-days";
export const DISMISSED_AT_KEY = "purrsist:a2hs:dismissed-at";

export const REQUIRED_ACTIVE_DAYS = 3;
export const DISMISS_COOLDOWN_DAYS = 7;
/** Cap the stored history — we only need to know the threshold has been passed. */
export const MAX_TRACKED_DAYS = 10;

const DAY_MS = 24 * 60 * 60 * 1000;
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export type PromptStorage = Pick<Storage, "getItem" | "setItem">;

export type DeviceInfo = {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
};

export type IphoneBrowser = "safari" | "chrome" | "firefox" | "edge" | "other";

export type EligibilityReason =
  | "ok"
  | "not-iphone"
  | "standalone"
  | "not-enough-days"
  | "recently-dismissed";

export type Eligibility = {
  eligible: boolean;
  reason: EligibilityReason;
};

/** Local calendar day as YYYY-MM-DD (matches src/lib/daily/time.ts). */
export function dayKey(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseActiveDays(raw: string | null): string[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  const days = value.filter(
    (d): d is string => typeof d === "string" && DATE_KEY_RE.test(d),
  );
  return [...new Set(days)].sort();
}

export function readActiveDays(storage: PromptStorage): string[] {
  return parseActiveDays(safeGet(storage, ACTIVE_DAYS_KEY));
}

/**
 * Record today as an active day. Idempotent within a calendar day; keeps only
 * the most recent MAX_TRACKED_DAYS. Returns the updated list.
 */
export function recordActiveDay(
  storage: PromptStorage,
  now: Date = new Date(),
): string[] {
  const today = dayKey(now);
  const current = readActiveDays(storage);
  if (current.includes(today)) return current;
  const next = [...current, today].sort().slice(-MAX_TRACKED_DAYS);
  safeSet(storage, ACTIVE_DAYS_KEY, JSON.stringify(next));
  return next;
}

export function readDismissedAt(storage: PromptStorage): number | null {
  const raw = safeGet(storage, DISMISSED_AT_KEY);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function recordDismissal(
  storage: PromptStorage,
  now: Date = new Date(),
): void {
  safeSet(storage, DISMISSED_AT_KEY, String(now.getTime()));
}

export function dismissedWithinCooldown(
  dismissedAt: number | null,
  now: Date = new Date(),
): boolean {
  if (dismissedAt == null) return false;
  const elapsed = now.getTime() - dismissedAt;
  return elapsed >= 0 && elapsed < DISMISS_COOLDOWN_DAYS * DAY_MS;
}

/** iPadOS ≥13 reports a desktop Safari UA; the touch-point check unmasks it. */
export function isIpad(device: DeviceInfo): boolean {
  if (/iPad/i.test(device.userAgent)) return true;
  return device.platform === "MacIntel" && device.maxTouchPoints > 1;
}

export function isIphone(device: DeviceInfo): boolean {
  if (isIpad(device)) return false;
  return /iPhone/i.test(device.userAgent);
}

/** The parts of `window` needed to tell a saved Home Screen app from a tab. */
export type StandaloneProbe = {
  matchMedia?: (query: string) => { matches: boolean };
  /** `navigator.standalone` is iOS-only and absent from the DOM lib types. */
  navigator?: { standalone?: boolean };
};

export function isStandalone(win: StandaloneProbe): boolean {
  if (win.navigator?.standalone === true) return true;
  try {
    return win.matchMedia?.("(display-mode: standalone)").matches === true;
  } catch {
    return false;
  }
}

/**
 * Best-effort iOS browser sniff. Every iOS browser renders with WebKit, but the
 * wrapper apps add a token: CriOS (Chrome), FxiOS (Firefox), EdgiOS (Edge),
 * GSA (Google app). Real Safari carries `Version/<n> … Mobile/<build> Safari/`.
 */
export function detectIphoneBrowser(userAgent: string): IphoneBrowser {
  if (/CriOS\//.test(userAgent)) return "chrome";
  if (/FxiOS\//.test(userAgent)) return "firefox";
  if (/EdgiOS\//.test(userAgent)) return "edge";
  if (/GSA\//.test(userAgent)) return "other";
  if (/Version\/[\d.]+ Mobile\/\w+ Safari\//.test(userAgent)) return "safari";
  return "other";
}

export type Instructions = {
  /** "safari" → the exact Share-sheet path; "other" → a browser-switch nudge. */
  mode: "safari" | "other";
  text: string;
};

const BROWSER_LABEL: Record<Exclude<IphoneBrowser, "safari">, string> = {
  chrome: "Chrome",
  firefox: "Firefox",
  edge: "Edge",
  other: "this browser",
};

export function instructionsFor(browser: IphoneBrowser): Instructions {
  if (browser === "safari") {
    return {
      mode: "safari",
      text: "In Safari, tap Share, then Add to Home Screen.",
    };
  }
  return {
    mode: "other",
    text:
      `You’re using ${BROWSER_LABEL[browser]}. Add to Home Screen is a Safari ` +
      `feature — open purrsist.co in Safari, then tap Share and choose Add to ` +
      `Home Screen.`,
  };
}

export function evaluatePromptEligibility(input: {
  device: DeviceInfo;
  standalone: boolean;
  activeDays: string[];
  dismissedAt: number | null;
  now?: Date;
}): Eligibility {
  const now = input.now ?? new Date();
  if (input.standalone) return { eligible: false, reason: "standalone" };
  if (!isIphone(input.device)) return { eligible: false, reason: "not-iphone" };
  if (dismissedWithinCooldown(input.dismissedAt, now)) {
    return { eligible: false, reason: "recently-dismissed" };
  }
  if (new Set(input.activeDays).size < REQUIRED_ACTIVE_DAYS) {
    return { eligible: false, reason: "not-enough-days" };
  }
  return { eligible: true, reason: "ok" };
}

function safeGet(storage: PromptStorage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: PromptStorage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    /* private mode / quota exceeded — day tracking is best-effort */
  }
}
