import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { readLinkError } from "@/lib/supabase/link-error";
import { LinkErrorNoticeView } from "./link-error-notice";

const meta = {
  title: "Auth/LinkErrorNotice",
  component: LinkErrorNoticeView,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ minHeight: 320 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    anchor: "bottom-right",
    onDismiss: fn(),
    error: readLinkError("?error_code=otp_expired", "")!,
  },
} satisfies Meta<typeof LinkErrorNoticeView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A used or replaced confirmation link — the common case. */
export const ExpiredLink: Story = {};

/** Any other Supabase error shows its own description. */
export const OtherError: Story = {
  args: {
    error: readLinkError(
      "?error=server_error&error_description=Database+error+saving+new+user",
      "",
    )!,
  },
};

export const MobileBanner: Story = { args: { anchor: "top" } };
