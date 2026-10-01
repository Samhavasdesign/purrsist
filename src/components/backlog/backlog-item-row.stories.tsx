import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { fn } from "storybook/test";
import { BACKLOG_ITEMS, EMPTY_ENTRY, IN_PROGRESS_ENTRY } from "@/stories/fixtures";
import { BacklogItemRow } from "./backlog-item-row";
import styles from "./backlog.module.css";

const meta = {
  title: "Backlog/BacklogItemRow",
  component: BacklogItemRow,
  args: {
    item: BACKLOG_ITEMS[0],
    todayEntry: IN_PROGRESS_ENTRY,
    showTag: true,
    promoteOpen: false,
    onPromoteOpen: fn(),
    onPromoteClose: fn(),
    onPromoted: fn(),
    onExitComplete: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <ul className={styles.list}>
          <Story />
        </ul>
      </div>
    ),
  ],
} satisfies Meta<typeof BacklogItemRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BigDeal: Story = {};

export const Errand: Story = { args: { item: BACKLOG_ITEMS[1] } };

export const ScheduledReminder: Story = { args: { item: BACKLOG_ITEMS[2] } };

export const Uncategorized: Story = { args: { item: BACKLOG_ITEMS[4] } };

export const WithoutTag: Story = { args: { showTag: false } };

/** Promote picker open — Today has open slots to land in. */
export const PromoteOpen: Story = {
  args: { promoteOpen: true, todayEntry: EMPTY_ENTRY },
};

export const PromoteToggle: Story = {
  name: "Promote (interactive)",
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <BacklogItemRow
        {...args}
        promoteOpen={open}
        onPromoteOpen={() => setOpen(true)}
        onPromoteClose={() => setOpen(false)}
      />
    );
  },
};
