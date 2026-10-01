import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConfirmEmailNotice } from "./confirm-email-notice";

const meta = {
  title: "Auth/ConfirmEmailNotice",
  component: ConfirmEmailNotice,
  args: { email: "sam@example.com" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ConfirmEmailNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TrialUpgrade: Story = {
  args: {
    children:
      "Once you confirm, this trial becomes your account and your data stays.",
  },
};
