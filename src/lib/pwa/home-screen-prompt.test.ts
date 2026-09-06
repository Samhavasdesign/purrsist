import { describe, expect, it } from "vitest";
import {
  ACTIVE_DAYS_KEY,
  DISMISSED_AT_KEY,
  type DeviceInfo,
  type PromptStorage,
  detectIphoneBrowser,
  dismissedWithinCooldown,
  evaluatePromptEligibility,
  instructionsFor,
  isIphone,
  isStandalone,
  parseActiveDays,
  readActiveDays,
  readDismissedAt,
  recordActiveDay,
  recordDismissal,
} from "./home-screen-prompt";

function makeStorage(seed: Record<string, string> = {}): PromptStorage & {
  dump: () => Record<string, string>;
} {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    dump: () => Object.fromEntries(map),
  };
}

const DAY = 24 * 60 * 60 * 1000;

// User agents ---------------------------------------------------------------
const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1",
  iphoneFirefox:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/604.1",
  iphoneEdge:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 EdgiOS/126.0.0.0 Mobile/15E148 Safari/604.1",
  ipad:
    "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  android:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  macSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
};

function device(userAgent: string, over: Partial<DeviceInfo> = {}): DeviceInfo {
  return { userAgent, platform: "iPhone", maxTouchPoints: 5, ...over };
}

const IPHONE = device(UA.iphoneSafari);

// -------------------------------------------------------------------------

describe("recordActiveDay", () => {
  it("adds today's calendar day", () => {
    const storage = makeStorage();
    const days = recordActiveDay(storage, new Date("2026-01-10T09:00:00"));
    expect(days).toEqual(["2026-01-10"]);
    expect(JSON.parse(storage.dump()[ACTIVE_DAYS_KEY])).toEqual(["2026-01-10"]);
  });

  it("is idempotent within the same calendar day", () => {
    const storage = makeStorage();
    recordActiveDay(storage, new Date("2026-01-10T08:00:00"));
    recordActiveDay(storage, new Date("2026-01-10T23:59:00"));
    expect(readActiveDays(storage)).toEqual(["2026-01-10"]);
  });

  it("accumulates distinct days", () => {
    const storage = makeStorage();
    recordActiveDay(storage, new Date("2026-01-10T10:00:00"));
    recordActiveDay(storage, new Date("2026-01-12T10:00:00"));
    recordActiveDay(storage, new Date("2026-01-15T10:00:00"));
    expect(readActiveDays(storage)).toEqual([
      "2026-01-10",
      "2026-01-12",
      "2026-01-15",
    ]);
  });

  it("keeps only the most recent 10 days", () => {
    const storage = makeStorage();
    for (let d = 1; d <= 14; d++) {
      const day = String(d).padStart(2, "0");
      recordActiveDay(storage, new Date(`2026-01-${day}T10:00:00`));
    }
    const days = readActiveDays(storage);
    expect(days).toHaveLength(10);
    expect(days[0]).toBe("2026-01-05");
    expect(days[9]).toBe("2026-01-14");
  });

  it("tolerates corrupt stored values", () => {
    const storage = makeStorage({ [ACTIVE_DAYS_KEY]: "not json" });
    const days = recordActiveDay(storage, new Date("2026-02-01T10:00:00"));
    expect(days).toEqual(["2026-02-01"]);
  });
});

describe("parseActiveDays", () => {
  it("drops non-date entries and dedupes", () => {
    expect(
      parseActiveDays('["2026-01-02","2026-01-02","nope",42,"2026-01-01"]'),
    ).toEqual(["2026-01-01", "2026-01-02"]);
  });

  it("returns [] for null / non-arrays", () => {
    expect(parseActiveDays(null)).toEqual([]);
    expect(parseActiveDays("{}")).toEqual([]);
  });
});

describe("dismissal tracking", () => {
  it("round-trips the dismissal timestamp", () => {
    const storage = makeStorage();
    const now = new Date("2026-03-01T12:00:00");
    recordDismissal(storage, now);
    expect(storage.dump()[DISMISSED_AT_KEY]).toBe(String(now.getTime()));
    expect(readDismissedAt(storage)).toBe(now.getTime());
  });

  it("reads missing / invalid values as null", () => {
    expect(readDismissedAt(makeStorage())).toBeNull();
    expect(readDismissedAt(makeStorage({ [DISMISSED_AT_KEY]: "abc" }))).toBeNull();
    expect(readDismissedAt(makeStorage({ [DISMISSED_AT_KEY]: "-1" }))).toBeNull();
  });

  it("is within cooldown before 7 days elapse", () => {
    const dismissedAt = new Date("2026-03-01T00:00:00").getTime();
    expect(
      dismissedWithinCooldown(dismissedAt, new Date(dismissedAt + 1 * DAY)),
    ).toBe(true);
    expect(
      dismissedWithinCooldown(dismissedAt, new Date(dismissedAt + 6.9 * DAY)),
    ).toBe(true);
  });

  it("is clear once 7 days have elapsed", () => {
    const dismissedAt = new Date("2026-03-01T00:00:00").getTime();
    expect(
      dismissedWithinCooldown(dismissedAt, new Date(dismissedAt + 7 * DAY)),
    ).toBe(false);
    expect(
      dismissedWithinCooldown(dismissedAt, new Date(dismissedAt + 30 * DAY)),
    ).toBe(false);
  });

  it("never blocks when there is no dismissal on record", () => {
    expect(dismissedWithinCooldown(null, new Date())).toBe(false);
  });
});

describe("device detection", () => {
  it("recognises an iPhone", () => {
    expect(isIphone(IPHONE)).toBe(true);
    expect(isIphone(device(UA.iphoneChrome))).toBe(true);
  });

  it("rejects iPad, including the desktop-UA masquerade", () => {
    expect(isIphone(device(UA.ipad, { platform: "iPad" }))).toBe(false);
    expect(
      isIphone(
        device(UA.macSafari, { platform: "MacIntel", maxTouchPoints: 5 }),
      ),
    ).toBe(false);
  });

  it("rejects Android and desktop", () => {
    expect(isIphone(device(UA.android, { platform: "Linux armv8l" }))).toBe(
      false,
    );
    expect(
      isIphone(
        device(UA.macSafari, { platform: "MacIntel", maxTouchPoints: 0 }),
      ),
    ).toBe(false);
  });
});

describe("isStandalone", () => {
  it("detects iOS navigator.standalone", () => {
    expect(isStandalone({ navigator: { standalone: true } })).toBe(true);
  });

  it("detects display-mode: standalone", () => {
    expect(
      isStandalone({ matchMedia: (q) => ({ matches: q.includes("standalone") }) }),
    ).toBe(true);
  });

  it("is false in a normal browser tab", () => {
    expect(
      isStandalone({
        navigator: { standalone: false },
        matchMedia: () => ({ matches: false }),
      }),
    ).toBe(false);
  });
});

describe("detectIphoneBrowser / instructionsFor", () => {
  it("identifies Safari and gives the Share-sheet steps", () => {
    expect(detectIphoneBrowser(UA.iphoneSafari)).toBe("safari");
    const help = instructionsFor("safari");
    expect(help.mode).toBe("safari");
    expect(help.text).toBe("In Safari, tap Share, then Add to Home Screen.");
  });

  it("identifies non-Safari iOS browsers", () => {
    expect(detectIphoneBrowser(UA.iphoneChrome)).toBe("chrome");
    expect(detectIphoneBrowser(UA.iphoneFirefox)).toBe("firefox");
    expect(detectIphoneBrowser(UA.iphoneEdge)).toBe("edge");
  });

  it("gives a Safari-redirect message (not Safari steps) for other browsers", () => {
    const help = instructionsFor("chrome");
    expect(help.mode).toBe("other");
    expect(help.text).toContain("Chrome");
    expect(help.text).toContain("Safari");
    expect(help.text).not.toBe("In Safari, tap Share, then Add to Home Screen.");
  });
});

describe("evaluatePromptEligibility", () => {
  const base = {
    device: IPHONE,
    standalone: false,
    activeDays: ["2026-01-01", "2026-01-02", "2026-01-03"],
    dismissedAt: null as number | null,
    now: new Date("2026-01-03T18:00:00"),
  };

  it("is eligible for a repeat iPhone visitor in the browser", () => {
    expect(evaluatePromptEligibility(base)).toEqual({
      eligible: true,
      reason: "ok",
    });
  });

  it("never shows in standalone mode", () => {
    expect(evaluatePromptEligibility({ ...base, standalone: true })).toEqual({
      eligible: false,
      reason: "standalone",
    });
  });

  it("never shows off an iPhone", () => {
    expect(
      evaluatePromptEligibility({
        ...base,
        device: device(UA.android, { platform: "Linux armv8l" }),
      }).reason,
    ).toBe("not-iphone");
    expect(
      evaluatePromptEligibility({
        ...base,
        device: device(UA.ipad, { platform: "iPad" }),
      }).reason,
    ).toBe("not-iphone");
  });

  it("waits for 3 distinct active days", () => {
    expect(
      evaluatePromptEligibility({
        ...base,
        activeDays: ["2026-01-01", "2026-01-02"],
      }),
    ).toEqual({ eligible: false, reason: "not-enough-days" });
  });

  it("counts only distinct days", () => {
    expect(
      evaluatePromptEligibility({
        ...base,
        activeDays: ["2026-01-01", "2026-01-01", "2026-01-01"],
      }).reason,
    ).toBe("not-enough-days");
  });

  it("stays hidden for 7 days after a dismissal, then returns", () => {
    const dismissedAt = new Date("2026-01-03T18:00:00").getTime();
    expect(
      evaluatePromptEligibility({
        ...base,
        dismissedAt,
        now: new Date(dismissedAt + 3 * DAY),
      }),
    ).toEqual({ eligible: false, reason: "recently-dismissed" });
    expect(
      evaluatePromptEligibility({
        ...base,
        dismissedAt,
        now: new Date(dismissedAt + 7 * DAY + 1),
      }),
    ).toEqual({ eligible: true, reason: "ok" });
  });

  it("integrates with the storage helpers", () => {
    const storage = makeStorage();
    recordActiveDay(storage, new Date("2026-05-01T09:00:00"));
    recordActiveDay(storage, new Date("2026-05-02T09:00:00"));
    let verdict = evaluatePromptEligibility({
      device: IPHONE,
      standalone: false,
      activeDays: readActiveDays(storage),
      dismissedAt: readDismissedAt(storage),
      now: new Date("2026-05-02T09:00:00"),
    });
    expect(verdict.eligible).toBe(false);

    recordActiveDay(storage, new Date("2026-05-04T09:00:00"));
    verdict = evaluatePromptEligibility({
      device: IPHONE,
      standalone: false,
      activeDays: readActiveDays(storage),
      dismissedAt: readDismissedAt(storage),
      now: new Date("2026-05-04T09:00:00"),
    });
    expect(verdict.eligible).toBe(true);

    recordDismissal(storage, new Date("2026-05-04T09:05:00"));
    verdict = evaluatePromptEligibility({
      device: IPHONE,
      standalone: false,
      activeDays: readActiveDays(storage),
      dismissedAt: readDismissedAt(storage),
      now: new Date("2026-05-06T09:00:00"),
    });
    expect(verdict).toEqual({ eligible: false, reason: "recently-dismissed" });
  });
});
