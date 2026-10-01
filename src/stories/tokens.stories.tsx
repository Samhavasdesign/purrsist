import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties, ReactNode } from "react";

/** Live swatches read straight from tokens.css — they follow any token edit. */

const CORE = [
  "--background",
  "--foreground",
  "--surface",
  "--border",
  "--muted",
  "--accent",
  "--accent-hover",
  "--accent-soft",
  "--danger",
  "--success",
  "--warning",
];

const CATEGORIES = ["must-do", "should-do", "quick-win", "support"] as const;

const TYPE_ROLES = [
  ["display", "Today"],
  ["title", "Must-Dos"],
  ["body", "Send the quarterly report to Dana"],
  ["label", "Add to backlog"],
  ["input", "Type here..."],
  ["caption", "Carried 2 days"],
  ["eyebrow", "WEEK OF SEP 28"],
] as const;

const SPACING = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16];
const RADII = ["sm", "md", "lg", "full"];

const label: CSSProperties = {
  font: "var(--text-caption)",
  color: "var(--muted)",
  fontFamily: "var(--font-eyebrow)",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2
        style={{
          font: "var(--text-title)",
          letterSpacing: "var(--text-title-tracking)",
          margin: "0 0 16px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Swatch({ token }: { token: string }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div
        style={{
          height: 56,
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border)",
          background: `var(${token})`,
        }}
      />
      <code style={label}>{token}</code>
    </div>
  );
}

const grid: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
  gap: 16,
};

function Tokens() {
  return (
    <div style={{ color: "var(--foreground)", maxWidth: 960 }}>
      <Section title="Core color">
        <div style={grid}>
          {CORE.map((token) => (
            <Swatch key={token} token={token} />
          ))}
        </div>
      </Section>

      <Section title="Category triads">
        <div style={{ ...grid, gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              style={{
                padding: 16,
                borderRadius: "var(--radius-lg)",
                background: `var(--${cat}-bg-fill)`,
                border: `1px solid var(--${cat}-border)`,
                color: `var(--${cat}-fg)`,
              }}
            >
              <p style={{ margin: 0, font: "var(--text-title)" }}>{cat}</p>
              <p
                style={{
                  margin: "8px 0 0",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  background: `var(--${cat}-tint)`,
                  font: "var(--text-body)",
                }}
              >
                -tint row
              </p>
              <p style={{ margin: "8px 0 0", font: "var(--text-caption)", color: `var(--${cat}-soft)` }}>
                -soft subcopy
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Type roles">
        <div style={{ display: "grid", gap: 16 }}>
          {TYPE_ROLES.map(([role, sample]) => (
            <div
              key={role}
              style={{ display: "grid", gridTemplateColumns: "120px 1fr", alignItems: "baseline", gap: 16 }}
            >
              <code style={label}>--text-{role}</code>
              <span
                style={{
                  font: `var(--text-${role})`,
                  letterSpacing: `var(--text-${role}-tracking)`,
                }}
              >
                {sample}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing">
        <div style={{ display: "grid", gap: 8 }}>
          {SPACING.map((step) => (
            <div key={step} style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <code style={{ ...label, width: 90 }}>--space-{step}</code>
              <div
                style={{
                  height: 12,
                  width: `var(--space-${step})`,
                  background: "var(--accent)",
                  borderRadius: 2,
                }}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius">
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {RADII.map((r) => (
            <div key={r} style={{ display: "grid", gap: 6, justifyItems: "center" }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  background: "var(--accent-soft)",
                  border: "1px solid var(--accent)",
                  borderRadius: `var(--radius-${r})`,
                }}
              />
              <code style={label}>--radius-{r}</code>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

const meta = {
  title: "Foundations/Tokens",
  component: Tokens,
  parameters: { a11y: { disable: true } },
} satisfies Meta<typeof Tokens>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {};
