import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CatPortrait, type CatPortraitName } from "./cat-portraits";

const NAMES: CatPortraitName[] = ["Mochi", "Biscuit", "Noodle", "Pickles", "Toast", "Bean"];

const meta = {
  title: "Collection/CatPortrait",
  component: CatPortrait,
  args: { name: "Mochi", className: undefined },
  argTypes: { name: { control: "select", options: NAMES } },
  decorators: [
    (Story) => (
      <div style={{ width: 160 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CatPortrait>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {};

export const AllCats: Story = {
  decorators: [(Story) => <div style={{ width: "auto" }}><Story /></div>],
  render: () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 16,
        width: "min(720px, 90vw)",
      }}
    >
      {NAMES.map((name) => (
        <figure key={name} style={{ margin: 0, textAlign: "center", font: "var(--text-caption)" }}>
          <CatPortrait name={name} title={name} />
          <figcaption>{name}</figcaption>
        </figure>
      ))}
    </div>
  ),
};
