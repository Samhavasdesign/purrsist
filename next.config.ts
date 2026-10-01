import type { NextConfig } from "next";
import path from "path";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  // Offline caching only — push notifications are a later phase (PRD §7 / §9).
  workboxOptions: {
    disableDevLogs: true,
  },
  // The component library at /storybook is built into public/ — keep it out
  // of every user's offline precache.
  publicExcludes: ["!noprecache/**/*", "!storybook/**/*"],
});

const nextConfig: NextConfig = {
  // Keep Turbopack rooted on this app (avoids picking up ~/package-lock.json).
  turbopack: {
    root: path.join(__dirname),
  },
  outputFileTracingRoot: path.join(__dirname),
  // Storybook (built into public/storybook by `npm run build`) loads its assets
  // with relative paths, so send the bare path to its index.html.
  async redirects() {
    return [
      {
        source: "/storybook",
        destination: "/storybook/index.html",
        permanent: false,
      },
    ];
  },
};

// next-pwa injects webpack config; skip it in `next dev` so Turbopack works.
const isDev = process.env.NODE_ENV === "development";
export default isDev ? nextConfig : withPWA(nextConfig);
