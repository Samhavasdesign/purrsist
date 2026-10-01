import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LogInInsteadButton } from "./log-in-instead-button";
import { TryItButton } from "./try-it-button";

const meta = {
  title: "Auth/TryItButton",
  component: TryItButton,
  args: { children: "Try it" },
} satisfies Meta<typeof TryItButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = { args: { children: "Start without an account" } };

export const LogInInstead: Story = {
  render: () => <LogInInsteadButton />,
};
