import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ARCHIVED_BACKLOG_ITEMS } from "@/stories/fixtures";
import { BacklogArchivedPanel } from "./backlog-archived-panel";

const meta = {
  title: "Backlog/BacklogArchivedPanel",
  component: BacklogArchivedPanel,
  args: { archivedItems: ARCHIVED_BACKLOG_ITEMS },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BacklogArchivedPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithItems: Story = {};

export const Empty: Story = { args: { archivedItems: [] } };
