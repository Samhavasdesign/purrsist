import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  CatHeadIcon,
  ChevronLeftIcon,
  CloseIcon,
  GripIcon,
  InfoIcon,
  PlusIcon,
  SparkleIcon,
} from "./icons";

const ICONS = {
  CatHeadIcon,
  ChevronLeftIcon,
  CloseIcon,
  GripIcon,
  InfoIcon,
  PlusIcon,
  SparkleIcon,
};

function Gallery({ size }: { size: 20 | 24 }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
        gap: 16,
        color: "var(--foreground)",
      }}
    >
      {Object.entries(ICONS).map(([name, Icon]) => (
        <figure
          key={name}
          style={{
            margin: 0,
            padding: 16,
            display: "grid",
            justifyItems: "center",
            gap: 8,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}
        >
          <Icon size={size} />
          <figcaption style={{ font: "var(--text-caption)", color: "var(--muted)" }}>
            {name}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

const meta = {
  title: "Foundations/Icons",
  component: Gallery,
  args: { size: 24 },
  argTypes: { size: { control: "inline-radio", options: [20, 24] } },
} satisfies Meta<typeof Gallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {};
