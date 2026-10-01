import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ScheduledToastView } from "./scheduled-toast";

const TODAY = "2026-10-01";

const meta = {
  title: "Backlog/ScheduledToast",
  component: ScheduledToastView,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 320 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    anchor: "bottom-right",
    onDismiss: fn(),
    toast: { date: "2026-10-04", fromAi: false, todayKey: TODAY },
  },
} satisfies Meta<typeof ScheduledToastView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** "call mom sunday" — read in code. */
export const FromText: Story = {};

/** "finish taxes by end of month" — worked out by the AI. */
export const FromAi: Story = {
  args: { toast: { date: "2026-10-31", fromAi: true, todayKey: TODAY } },
};

export const Tomorrow: Story = {
  args: { toast: { date: "2026-10-02", fromAi: false, todayKey: TODAY } },
};

export const Today: Story = {
  args: { toast: { date: TODAY, fromAi: false, todayKey: TODAY } },
};

export const MobileBanner: Story = {
  args: {
    anchor: "top",
    toast: { date: "2026-10-31", fromAi: true, todayKey: TODAY },
  },
};
