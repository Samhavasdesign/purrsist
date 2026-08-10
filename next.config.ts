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
});

const nextConfig: NextConfig = {
  // Keep Turbopack rooted on this app (avoids picking up ~/package-lock.json).
  turbopack: {
    root: path.join(__dirname),
  },
  outputFileTracingRoot: path.join(__dirname),
};

// next-pwa injects webpack config; skip it in `next dev` so Turbopack works.
const isDev = process.env.NODE_ENV === "development";
export default isDev ? nextConfig : withPWA(nextConfig);
