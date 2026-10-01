import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { HABITS_WITH_CHECKINS, todayKey } from "@/stories/fixtures";
import { HabitManager } from "./habit-manager";

const meta = {
  title: "Today/HabitManager",
  component: HabitManager,
  args: {
    date: todayKey(),
    habits: HABITS_WITH_CHECKINS,
    onSectionWin: fn(),
    onHabitsCompleteChange: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HabitManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllChecked: Story = {
  args: { habits: HABITS_WITH_CHECKINS.map((h) => ({ ...h, done_today: true })) },
};

export const NoHabits: Story = { args: { habits: [] } };

export const ReadOnly: Story = { args: { readOnly: true } };
