import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
  ChevronLeftIcon,
  CloseIcon,
  InfoIcon,
  PlusIcon,
} from "@/components/icons/icons";
import { IconButton } from "./icon-button";

const meta = {
  title: "UI/IconButton",
  component: IconButton,
  args: {
    label: "Add",
    icon: <PlusIcon />,
    onClick: fn(),
  },
  argTypes: {
    icon: { control: false },
    tone: { control: "inline-radio", options: ["default", "ghost"] },
    iconSize: { control: "inline-radio", options: [20, 24] },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Ghost: Story = {
  args: { tone: "ghost", label: "Remove task", icon: <CloseIcon /> },
};

export const Active: Story = {
  args: { active: true, label: "About Purrsist", icon: <InfoIcon /> },
};

export const Disabled: Story = { args: { disabled: true } };

export const AllVariants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <IconButton {...args} label="Add" icon={<PlusIcon />} />
      <IconButton {...args} label="Info" icon={<InfoIcon />} active />
      <IconButton
        {...args}
        label="Back"
        icon={<ChevronLeftIcon />}
        iconSize={24}
        tone="ghost"
      />
      <IconButton {...args} label="Remove" icon={<CloseIcon />} tone="ghost" />
      <IconButton {...args} label="Disabled" icon={<PlusIcon />} disabled />
    </div>
  ),
};
