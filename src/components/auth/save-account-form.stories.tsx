import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SaveAccountForm } from "./save-account-form";

const meta = {
  title: "Auth/SaveAccountForm",
  component: SaveAccountForm,
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 480 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SaveAccountForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
