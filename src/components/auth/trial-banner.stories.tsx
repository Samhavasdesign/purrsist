import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TrialBanner } from "./trial-banner";

const meta = {
  title: "Auth/TrialBanner",
  component: TrialBanner,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TrialBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mobile: Story = { globals: { viewport: { value: "mobile1" } } };
