import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Social/link-preview card (iMessage, Slack, WhatsApp, Discord, X, Facebook).
// These clients read og:image / twitter:image — never the favicon — so the
// brand mark has to be baked into a real raster image here.

export const alt = "Purrsist — keep your day sorted and your habits on track";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Assets are request-independent: read once at module scope, project-root
// relative (see Next.js "opengraph-image" Node.js runtime docs).
const wordmark = await readFile(join(process.cwd(), "public/logo.svg"), "base64");
const wordmarkSrc = `data:image/svg+xml;base64,${wordmark}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 44,
          background: "#faf9f6",
          border: "16px solid #e5e0d7",
        }}
      >
        <img src={wordmarkSrc} width={760} height={236} alt="" />
        <div
          style={{
            width: 72,
            height: 6,
            borderRadius: 3,
            background: "#5b63a6",
          }}
        />
        <div style={{ fontSize: 38, color: "#696370", letterSpacing: -0.5 }}>
          Keep your day sorted and your habits on track.
        </div>
      </div>
    ),
    { ...size },
  );
}
