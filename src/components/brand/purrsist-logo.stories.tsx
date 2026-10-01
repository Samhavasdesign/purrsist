import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PurrsistLogo } from "./purrsist-logo";

const meta = {
  title: "Foundations/Logo",
  component: PurrsistLogo,
} satisfies Meta<typeof PurrsistLogo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = { args: { style: { height: 64 } } };
