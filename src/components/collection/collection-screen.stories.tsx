import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { appColumn } from "@/stories/decorators";
import { CollectionScreen, MOCK_RESCUED_CATS } from "./collection-screen";

const meta = {
  title: "Collection/CollectionScreen",
  component: CollectionScreen,
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/collection" } },
  },
  decorators: [appColumn],
} satisfies Meta<typeof CollectionScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HighlightedCat: Story = {
  name: "Highlighted (from rescue toast)",
  args: { highlightCatId: MOCK_RESCUED_CATS[0]?.id ?? null },
};
