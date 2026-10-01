import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, userEvent, within } from "storybook/test";
import { addToBacklog } from "@/lib/backlog/actions";
import { BacklogDraftRow } from "./backlog-draft-row";
import styles from "./backlog.module.css";

const meta = {
  title: "Backlog/BacklogDraftRow",
  component: BacklogDraftRow,
  args: { onSaved: fn(), onDiscard: fn() },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 640 }}>
        <ul className={styles.list}>
          <Story />
        </ul>
      </div>
    ),
  ],
} satisfies Meta<typeof BacklogDraftRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const SavesOnEnter: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("New backlog item"), "Renew passport{enter}");
    await expect(addToBacklog).toHaveBeenCalledWith("Renew passport");
    await expect(args.onSaved).toHaveBeenCalled();
  },
};

export const SaveError: Story = {
  beforeEach() {
    mocked(addToBacklog).mockResolvedValue({ ok: false, error: "Type something first." });
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("New backlog item"), "Renew passport{enter}");
    await expect(await canvas.findByRole("alert")).toBeVisible();
  },
};
