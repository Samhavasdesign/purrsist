import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { todayKey } from "@/stories/fixtures";
import { DueReminders } from "./due-reminders";

const meta = {
  title: "Today/DueReminders",
  component: DueReminders,
  args: {
    reminders: [
      { id: "d1", text: "Call grandma on her birthday", target_date: todayKey(), overdue: false },
      { id: "d2", text: "Renew car registration", target_date: todayKey(-2), overdue: true },
    ],
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 560 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DueReminders>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Single: Story = {
  args: {
    reminders: [
      { id: "d1", text: "Call grandma on her birthday", target_date: todayKey(), overdue: false },
    ],
  },
};

export const ReadOnly: Story = { args: { readOnly: true } };
