import type { StorybookConfig } from "@storybook/nextjs-vite";
import type { Plugin } from "vite";

/**
 * Components whose `?flag` preview hatches are gated on NODE_ENV !== "production".
 * The hosted Storybook is a production build, so keep those hatches live there
 * (Storybook only — the app's own build is untouched).
 */
const PREVIEW_HATCH_FILES = [
  "src/components/daily/end-of-day-sheet.tsx",
  "src/components/pwa/home-screen-prompt.tsx",
];

function keepPreviewHatches(): Plugin {
  return {
    name: "purrsist:keep-preview-hatches",
    enforce: "pre",
    transform(code, id) {
      if (!PREVIEW_HATCH_FILES.some((file) => id.endsWith(file))) return;
      return code.replaceAll("process.env.NODE_ENV", '"development"');
    },
  };
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)", "../src/**/*.mdx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  async viteFinal(config) {
    config.plugins = [keepPreviewHatches(), ...(config.plugins ?? [])];
    // The build is written into public/storybook — don't copy public/ (the
    // app's service worker, or a previous Storybook build) into itself.
    config.publicDir = false;
    return config;
  },
};

export default config;
