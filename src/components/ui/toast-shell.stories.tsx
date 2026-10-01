import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ToastShell } from "./toast-shell";

const meta = {
  title: "UI/ToastShell",
  component: ToastShell,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 320 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    children: (
      <div style={{ padding: 16, font: "var(--text-body)" }}>
        Saved to your backlog.
      </div>
    ),
  },
  argTypes: {
    anchor: {
      control: "inline-radio",
      options: ["bottom-right", "top-right", "top", "bottom"],
    },
    children: { control: false },
  },
} satisfies Meta<typeof ToastShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BottomRight: Story = { args: { anchor: "bottom-right" } };
export const TopRight: Story = { args: { anchor: "top-right" } };
export const TopBanner: Story = { args: { anchor: "top" } };
export const BottomSnackbar: Story = { args: { anchor: "bottom" } };
