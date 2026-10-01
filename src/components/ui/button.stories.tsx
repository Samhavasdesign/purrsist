import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Save",
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: ["primary", "secondary", "category", "nav"],
    },
    category: { control: "inline-radio", options: ["red", "yellow", "green"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { variant: "primary" } };

export const Secondary: Story = {
  args: { variant: "secondary", children: "Not now" },
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true, children: "Adding…" },
};

export const Category: Story = {
  args: { variant: "category", category: "red", children: "Add Must-Do" },
};

export const CategoryTones: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 360 }}>
      <Button {...args} variant="category" category="red">
        Add Must-Do
      </Button>
      <Button {...args} variant="category" category="yellow">
        Add Should-Do
      </Button>
      <Button {...args} variant="category" category="green">
        Add Quick Win
      </Button>
      <Button {...args} variant="category" category="green" selected>
        Selected
      </Button>
    </div>
  ),
};

export const Nav: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 8 }}>
      <Button {...args} variant="nav" selected href="/dashboard">
        Today
      </Button>
      <Button {...args} variant="nav" href="/backlog">
        Backlog
      </Button>
    </div>
  ),
};

export const AsLink: Story = {
  args: { variant: "secondary", href: "/backlog", children: "Open backlog" },
};
