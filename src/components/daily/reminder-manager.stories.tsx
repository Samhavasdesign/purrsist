import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { EMPTY_ENTRY, IN_PROGRESS_ENTRY, makeEntry } from "@/stories/fixtures";
import { ReminderManager } from "./reminder-manager";

const meta = {
  title: "Today/ReminderManager",
  component: ReminderManager,
  args: { entry: IN_PROGRESS_ENTRY },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ReminderManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneReminder: Story = {};

export const Empty: Story = { args: { entry: EMPTY_ENTRY } };

export const Several: Story = {
  args: {
    entry: makeEntry({
      notes: JSON.stringify({
        purrsist_reminders: [
          { id: "r1", text: "Trash goes out tonight" },
          { id: "r2", text: "Bring the umbrella" },
          { id: "r3", text: "Mochi's flea drops on Sunday" },
        ],
      }),
    }),
  },
};

export const ReadOnly: Story = { args: { readOnly: true } };
