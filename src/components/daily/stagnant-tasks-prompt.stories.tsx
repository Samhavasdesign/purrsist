import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { userEvent, within } from "storybook/test";
import { makeEntry, STAGNANT_ENTRY } from "@/stories/fixtures";
import { StagnantTasksPrompt } from "./stagnant-tasks-prompt";

const meta = {
  title: "Today/StagnantTasksPrompt",
  component: StagnantTasksPrompt,
  args: { entry: STAGNANT_ENTRY },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560, minHeight: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StagnantTasksPrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MultipleTasks: Story = {};

export const SingleTask: Story = {
  args: {
    entry: makeEntry({
      must_do_text: "Fix the leaky faucet",
      must_do_carryover_count: 5,
    }),
  },
};

export const ReviewModal: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", { name: /Review/ }));
  },
};
