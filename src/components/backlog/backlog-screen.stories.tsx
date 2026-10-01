import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { appColumn } from "@/stories/decorators";
import {
  ARCHIVED_BACKLOG_ITEMS,
  BACKLOG_ITEMS,
  IN_PROGRESS_ENTRY,
} from "@/stories/fixtures";
import { BacklogScreen } from "./backlog-screen";

const meta = {
  title: "Backlog/BacklogScreen",
  component: BacklogScreen,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/backlog" } },
  },
  args: {
    tab: "active",
    listItems: BACKLOG_ITEMS,
    reviewItems: BACKLOG_ITEMS.slice(0, 3),
    archivedItems: ARCHIVED_BACKLOG_ITEMS,
    todayEntry: IN_PROGRESS_ENTRY,
  },
  decorators: [appColumn],
} satisfies Meta<typeof BacklogScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};

export const Empty: Story = {
  args: { listItems: [], reviewItems: [] },
};

export const Archived: Story = { args: { tab: "archived" } };

export const Mobile: Story = {
  globals: { viewport: { value: "mobile1" } },
};
