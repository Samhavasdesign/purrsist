import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SignificanceDot } from "./significance-dot";

const meta = {
  title: "Backlog/SignificanceDot",
  component: SignificanceDot,
  args: { value: "red" },
  argTypes: {
    value: { control: "inline-radio", options: ["red", "yellow", "green", null] },
  },
} satisfies Meta<typeof SignificanceDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BigDeal: Story = {};

export const AllValues: Story = {
  render: () => (
    <div style={{ display: "flex", gap: 24, alignItems: "center", font: "var(--text-caption)" }}>
      {(["red", "yellow", "green", null] as const).map((value) => (
        <span key={String(value)} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <SignificanceDot value={value} />
          {value ?? "unset"}
        </span>
      ))}
    </div>
  ),
};
