import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppNav } from "./app-nav";

const meta = {
  title: "Nav/AppNav",
  component: AppNav,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/dashboard" } },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 200 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AppNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TodayActive: Story = {};

export const BacklogActive: Story = {
  parameters: { nextjs: { navigation: { pathname: "/backlog" } } },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile1" } },
};
