import type { Decorator } from "@storybook/nextjs-vite";

/**
 * Adds a query flag to the preview iframe's URL before the story renders —
 * for components with dev-only `?flag` preview hatches (they're compiled out
 * of production builds, so these stories only open under `npm run storybook`).
 */
export function withSearchParam(key: string, value: string): Decorator {
  return function WithSearchParam(Story) {
    const url = new URL(window.location.href);
    if (url.searchParams.get(key) !== value) {
      url.searchParams.set(key, value);
      window.history.replaceState(window.history.state, "", url);
    }
    return <Story />;
  };
}

/** Centers a full-screen story in the app's content column. */
export const appColumn: Decorator = (Story) => (
  <main
    style={{
      maxWidth: "var(--app-content-max)",
      margin: "0 auto",
      padding: "24px 16px 96px",
    }}
  >
    <Story />
  </main>
);
