import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import { ViewTabs } from "./view-tabs";

const OPTIONS = [
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
] as const;

type Tab = (typeof OPTIONS)[number]["value"];

function Controlled({ initial = "active" }: { initial?: Tab }) {
  const [value, setValue] = useState<Tab>(initial);
  return (
    <ViewTabs
      value={value}
      options={OPTIONS}
      ariaLabel="Backlog view"
      onChange={setValue}
    />
  );
}

const meta = {
  title: "UI/ViewTabs",
  component: Controlled,
} satisfies Meta<typeof Controlled>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};

export const Archived: Story = { args: { initial: "archived" } };

export const SwitchesTab: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("tab", { name: "Archived" }));
    await expect(canvas.getByRole("tab", { name: "Archived" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  },
};
