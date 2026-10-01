import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { AccountMenu } from "./account-menu";

const meta = {
  title: "Nav/AccountMenu",
  component: AccountMenu,
  args: { displayName: "Sam", email: "sam@example.com" },
  decorators: [
    (Story) => (
      <div style={{ display: "flex", justifyContent: "flex-end", minHeight: 240 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AccountMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Account/ }));
    await expect(canvas.getByRole("menu")).toBeVisible();
  },
};

export const NoEmail: Story = {
  args: { displayName: "Guest", email: null },
  play: Open.play,
};
