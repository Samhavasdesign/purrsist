import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { BACKLOG_ITEMS } from "@/stories/fixtures";
import { ReviewPass } from "./review-pass";

const meta = {
  title: "Backlog/ReviewPass",
  component: ReviewPass,
  parameters: { layout: "fullscreen" },
  args: { items: BACKLOG_ITEMS.slice(0, 3), onClose: fn() },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 640 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReviewPass>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeItems: Story = {};

export const SingleItem: Story = { args: { items: BACKLOG_ITEMS.slice(0, 1) } };
