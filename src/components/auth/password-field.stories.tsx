import { useState, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PasswordField } from "./password-field";

function Controlled(props: ComponentProps<typeof PasswordField>) {
  const [value, setValue] = useState(props.value);
  return <PasswordField {...props} value={value} onChange={setValue} />;
}

const meta = {
  title: "Auth/PasswordField",
  component: PasswordField,
  args: {
    id: "password",
    label: "Password",
    value: "",
    onChange: () => {},
    autoComplete: "new-password",
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof PasswordField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHint: Story = { args: { hint: "At least 6 characters." } };

export const Invalid: Story = {
  args: { label: "Confirm password", value: "hunter2", invalid: true },
};
