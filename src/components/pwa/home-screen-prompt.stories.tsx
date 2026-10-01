import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { withSearchParam } from "@/stories/decorators";
import { HomeScreenPrompt } from "./home-screen-prompt";

const IPHONE_SAFARI_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

/** `?a2hsPreview=1` skips the eligibility gates (dev builds only). */
const meta = {
  title: "PWA/HomeScreenPrompt",
  component: HomeScreenPrompt,
  parameters: { layout: "fullscreen" },
  decorators: [
    withSearchParam("a2hsPreview", "1"),
    (Story) => (
      <div style={{ minHeight: 640 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HomeScreenPrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const IphoneSafari: Story = {
  globals: { viewport: { value: "mobile1" } },
  beforeEach() {
    const original = Object.getOwnPropertyDescriptor(Navigator.prototype, "userAgent");
    Object.defineProperty(navigator, "userAgent", {
      value: IPHONE_SAFARI_UA,
      configurable: true,
    });
    return () => {
      delete (navigator as { userAgent?: string }).userAgent;
      if (original) Object.defineProperty(Navigator.prototype, "userAgent", original);
    };
  },
};
