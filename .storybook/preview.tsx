import type { Preview } from "@storybook/nextjs-vite";
import { mocked, sb } from "storybook/test";
import "../src/app/globals.css";

// Server actions talk to Supabase — replace every export with a spy so stories
// render offline. Defaults below make each action "succeed"; a story can
// override one with mocked(fn).mockResolvedValue(...) in its beforeEach.
sb.mock(import("../src/lib/backlog/actions.ts"));
sb.mock(import("../src/lib/daily/actions.ts"));
sb.mock(import("../src/lib/daily/stagnant.ts"));
sb.mock(import("../src/lib/capture/actions.ts"));
sb.mock(import("../src/lib/profile/actions.ts"));
sb.mock(import("../src/lib/auth/try-it.ts"));

import * as backlogActions from "../src/lib/backlog/actions";
import * as dailyActions from "../src/lib/daily/actions";
import * as stagnantActions from "../src/lib/daily/stagnant";
import * as profileActions from "../src/lib/profile/actions";

const OK_ACTIONS = [
  ...Object.values(backlogActions),
  ...Object.values(dailyActions),
  stagnantActions.saveStagnantToBacklog,
  stagnantActions.archiveStagnantTask,
  ...Object.values(profileActions),
];

const preview: Preview = {
  parameters: {
    nextjs: { appDirectory: true },
    layout: "padded",
    backgrounds: {
      options: {
        page: { name: "Page", value: "#faf9f6" },
        surface: { name: "Surface", value: "#ffffff" },
      },
    },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: { test: "todo" },
  },
  initialGlobals: {
    backgrounds: { value: "page" },
  },
  beforeEach() {
    for (const fn of OK_ACTIONS) {
      if (typeof fn === "function" && "mockResolvedValue" in fn) {
        mocked(fn as (...args: unknown[]) => Promise<unknown>).mockResolvedValue({ ok: true });
      }
    }
    // Clear per-day dismissals so banners/nudges show on every story load.
    try {
      window.localStorage.clear();
    } catch {
      /* storage unavailable */
    }
  },
};

export default preview;
