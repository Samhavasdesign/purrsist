import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { todayKey } from "@/stories/fixtures";
import { RescueToast } from "./rescue-toast";

const meta = {
  title: "Today/RescueToast",
  component: RescueToast,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 320 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    rescue: {
      rescueId: "rescue-1",
      catId: "cat-mochi",
      catName: "Mochi",
      imageKey: "Mochi",
      weekStartDate: todayKey(-7),
    },
  },
} satisfies Meta<typeof RescueToast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Mochi: Story = {};

export const Biscuit: Story = {
  args: {
    rescue: {
      rescueId: "rescue-2",
      catId: "cat-biscuit",
      catName: "Biscuit",
      imageKey: "Biscuit",
      weekStartDate: todayKey(-7),
    },
  },
};
