import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { mocked } from "storybook/test";
import { setDigestEnabled } from "@/lib/profile/actions";
import { DigestToggle } from "./digest-toggle";

const meta = {
  title: "Settings/DigestToggle",
  component: DigestToggle,
  args: { initialEnabled: true },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DigestToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const On: Story = {};

export const Off: Story = { args: { initialEnabled: false } };

export const SaveFails: Story = {
  name: "Save fails (tap to see error)",
  beforeEach() {
    mocked(setDigestEnabled).mockResolvedValue({ ok: false, error: "Couldn't save — try again." });
  },
};
