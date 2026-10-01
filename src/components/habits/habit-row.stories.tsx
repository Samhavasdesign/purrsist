import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { HABITS } from "@/stories/fixtures";
import { HabitDraftRow } from "./habit-draft-row";
import { HabitRow } from "./habit-row";
import styles from "./habits-page.module.css";

const meta = {
  title: "Habits/HabitRow",
  component: HabitRow,
  args: { habit: HABITS[0], onArchive: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <ul className={styles.list}>
          <Story />
        </ul>
      </div>
    ),
  ],
} satisfies Meta<typeof HabitRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const StartedToday: Story = { args: { habit: HABITS[2] } };

export const Busy: Story = { args: { busy: true } };

export const Draft: Story = {
  render: () => <HabitDraftRow onSaved={fn()} onDiscard={fn()} />,
};
