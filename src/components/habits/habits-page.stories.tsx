import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { appColumn } from "@/stories/decorators";
import { ARCHIVED_HABITS, HABITS } from "@/stories/fixtures";
import { HabitsPage } from "./habits-page";

const meta = {
  title: "Habits/HabitsPage",
  component: HabitsPage,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/habits" } },
  },
  args: { tab: "active", activeHabits: HABITS, archivedHabits: ARCHIVED_HABITS },
  decorators: [appColumn],
} satisfies Meta<typeof HabitsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};

export const NoHabits: Story = { args: { activeHabits: [] } };

export const Archived: Story = { args: { tab: "archived" } };
