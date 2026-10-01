import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { appColumn } from "@/stories/decorators";
import { DEFAULT_SECTION_HINT_FLAGS } from "@/lib/daily/section-hints";
import {
  ALL_DONE_ENTRY,
  EMPTY_ENTRY,
  HABITS_WITH_CHECKINS,
  IN_PROGRESS_ENTRY,
  OVERFLOW_ENTRY,
  PAST_ENTRY,
  STAGNANT_ENTRY,
  todayKey,
} from "@/stories/fixtures";
import { DailyDashboard } from "./daily-dashboard";

const SEEN_HINTS = {
  hasFilledMustDoOnce: true,
  hasFilledShouldDosOnce: true,
  hasFilledQuickWinsOnce: true,
};

const meta = {
  title: "Today/DailyDashboard",
  component: DailyDashboard,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/dashboard" } },
  },
  args: {
    entry: IN_PROGRESS_ENTRY,
    habits: HABITS_WITH_CHECKINS,
    sectionHints: SEEN_HINTS,
    dueReminders: [],
    rescueToast: null,
  },
  decorators: [appColumn],
} satisfies Meta<typeof DailyDashboard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InProgress: Story = {};

export const FirstRun: Story = {
  name: "First run (empty, hints on)",
  args: { entry: EMPTY_ENTRY, sectionHints: DEFAULT_SECTION_HINT_FLAGS, habits: [] },
};

export const AllDone: Story = {
  args: {
    entry: ALL_DONE_ENTRY,
    habits: HABITS_WITH_CHECKINS.map((h) => ({ ...h, done_today: true })),
  },
};

export const OverCapacity: Story = {
  name: "Over capacity (extra items)",
  args: { entry: OVERFLOW_ENTRY },
};

export const WithDueReminders: Story = {
  args: {
    dueReminders: [
      { id: "d1", text: "Call grandma on her birthday", target_date: todayKey(), overdue: false },
      { id: "d2", text: "Renew car registration", target_date: todayKey(-2), overdue: true },
    ],
  },
};

export const StagnantNudge: Story = {
  name: "Stagnant-task nudge",
  args: { entry: STAGNANT_ENTRY },
};

export const RescueToast: Story = {
  args: {
    rescueToast: {
      rescueId: "rescue-1",
      catId: "cat-mochi",
      catName: "Mochi",
      imageKey: "Mochi",
      weekStartDate: todayKey(-7),
    },
  },
};

export const PastDayLocked: Story = {
  name: "Past day (locked)",
  args: { entry: PAST_ENTRY },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile1" } },
};
