import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppTopBar } from "./app-top-bar";

const meta = {
  title: "Nav/AppTopBar",
  component: AppTopBar,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/dashboard" } },
  },
  args: {
    catCount: 3,
    isGuest: false,
    displayName: "Sam",
    email: "sam@example.com",
  },
} satisfies Meta<typeof AppTopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {};

export const Guest: Story = {
  args: { isGuest: true, displayName: "Guest", email: null, catCount: 0 },
};

export const OneCat: Story = { args: { catCount: 1 } };

export const WithBackButton: Story = {
  parameters: { nextjs: { navigation: { pathname: "/backlog" } } },
};

export const CollectionActive: Story = {
  parameters: { nextjs: { navigation: { pathname: "/collection" } } },
};

export const NestedSettings: Story = {
  parameters: { nextjs: { navigation: { pathname: "/settings/account" } } },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile1" } },
};
