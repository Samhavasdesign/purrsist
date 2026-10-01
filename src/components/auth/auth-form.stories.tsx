import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AuthForm } from "./auth-form";

const meta = {
  title: "Auth/AuthForm",
  component: AuthForm,
  args: { mode: "login" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AuthForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LogIn: Story = {};

export const SignUp: Story = { args: { mode: "signup" } };
