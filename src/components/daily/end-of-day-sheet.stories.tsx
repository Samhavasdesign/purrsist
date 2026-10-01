import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { withSearchParam } from "@/stories/decorators";
import { IN_PROGRESS_ENTRY } from "@/stories/fixtures";
import { EndOfDaySheet } from "./end-of-day-sheet";

/**
 * The sheet only auto-opens in the evening; `?eod=demo` (dev builds only)
 * forces it open on load, so the decorator adds that flag to the iframe URL.
 */
const meta = {
  title: "Today/EndOfDaySheet",
  component: EndOfDaySheet,
  parameters: { layout: "fullscreen" },
  args: { entry: IN_PROGRESS_ENTRY },
  decorators: [
    withSearchParam("eod", "demo"),
    (Story) => (
      <div style={{ minHeight: 640 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof EndOfDaySheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};
