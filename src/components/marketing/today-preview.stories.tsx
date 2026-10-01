import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TodayPreview } from "./today-preview";

const meta = {
  title: "Marketing/TodayPreview",
  component: TodayPreview,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TodayPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
