import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { appColumn } from "@/stories/decorators";
import { ALL_DONE_ENTRY, PAST_ENTRY, todayKey } from "@/stories/fixtures";
import { ArchiveScreen } from "./archive-screen";

const DATES = [
  { date: todayKey(-1), locked: true, must_do_done: true, must_do_text: "Send the quarterly report" },
  { date: todayKey(-2), locked: true, must_do_done: false, must_do_text: "Fix the leaky faucet" },
  { date: todayKey(-3), locked: true, must_do_done: true, must_do_text: "Book the vet appointment" },
];

const HABIT_CHECKS = [
  { habit_id: "h1", name: "Drink 8 glasses of water", done: true },
  { habit_id: "h2", name: "Stretch for 10 minutes", done: false },
];

const meta = {
  title: "Archive/ArchiveScreen",
  component: ArchiveScreen,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/archive" } },
  },
  args: {
    dates: DATES,
    selectedDate: DATES[2].date,
    entry: { ...PAST_ENTRY, date: DATES[2].date },
    habits: HABIT_CHECKS,
  },
  decorators: [appColumn],
} satisfies Meta<typeof ArchiveScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PartialDay: Story = {};

export const PerfectDay: Story = {
  args: {
    selectedDate: DATES[0].date,
    entry: { ...ALL_DONE_ENTRY, date: DATES[0].date, locked: true },
    habits: HABIT_CHECKS.map((h) => ({ ...h, done: true })),
  },
};

export const NoHistory: Story = {
  args: { dates: [], selectedDate: null, entry: null, habits: [] },
};
