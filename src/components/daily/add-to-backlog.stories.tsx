import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, userEvent, within } from "storybook/test";
import { addToBacklog } from "@/lib/backlog/actions";
import { AddToBacklog } from "./add-to-backlog";

const meta = {
  title: "Today/AddToBacklog",
  component: AddToBacklog,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AddToBacklog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};

export const Open: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /Add to backlog/ }));
  },
};

export const WithText: Story = {
  play: async (ctx) => {
    await Open.play!(ctx);
    const canvas = within(ctx.canvasElement);
    await userEvent.type(
      await canvas.findByPlaceholderText("What's on your mind?"),
      "Renew passport",
    );
  },
};

export const SubmitsToBacklog: Story = {
  play: async (ctx) => {
    await WithText.play!(ctx);
    const canvas = within(ctx.canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
    await expect(addToBacklog).toHaveBeenCalledWith("Renew passport");
  },
};

export const ServerError: Story = {
  beforeEach() {
    mocked(addToBacklog).mockResolvedValue({
      ok: false,
      error: "Couldn't reach the server — try again.",
    });
  },
  play: SubmitsToBacklog.play,
};
