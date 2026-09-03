"use client";

/*
 * Living token explorer. Every value shown here is read from the actual
 * computed styles of :root at runtime, so this page can never drift from
 * src/styles/tokens.css — if a token changes, this reflects it on reload.
 */

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import styles from "./design-system.module.css";

/*
 * Resolve a set of CSS custom properties off :root. Values are read once per
 * unique token set and cached so getSnapshot stays referentially stable (a
 * requirement of useSyncExternalStore). There is no theme toggle today; wire a
 * store subscription here if one is ever added.
 */
const tokenCache = new Map<string, Record<string, string>>();
const EMPTY_TOKENS: Record<string, string> = {};
const noopSubscribe = () => () => {};

function readTokens(names: string[]): Record<string, string> {
  const key = names.join("|");
  const cached = tokenCache.get(key);
  if (cached) return cached;

  const root = getComputedStyle(document.documentElement);
  const resolved: Record<string, string> = {};
  for (const name of names) {
    resolved[name] = root.getPropertyValue(name).trim() || "—";
  }
  tokenCache.set(key, resolved);
  return resolved;
}

function useVarValues(names: string[]): Record<string, string> {
  return useSyncExternalStore(
    noopSubscribe,
    () => readTokens(names),
    () => EMPTY_TOKENS,
  );
}

/* ------------------------------------------------------------------ colors */

export function ColorSwatches({ tokens }: { tokens: string[] }) {
  const values = useVarValues(tokens);
  return (
    <div className={styles.swatchGrid}>
      {tokens.map((token) => (
        <div key={token} className={styles.swatch}>
          <span
            className={styles.swatchChip}
            style={{ background: `var(${token})` }}
          />
          <code className={styles.swatchName}>{token}</code>
          <code className={styles.swatchValue}>{values[token] ?? "…"}</code>
        </div>
      ))}
    </div>
  );
}

export function GradientSwatches({ tokens }: { tokens: string[] }) {
  const values = useVarValues(tokens);
  return (
    <div className={styles.gradientGrid}>
      {tokens.map((token) => (
        <div key={token} className={styles.gradientCard}>
          <span
            className={styles.gradientPreview}
            style={{ backgroundImage: `var(${token})` }}
          />
          <code className={styles.swatchName}>{token}</code>
          <code className={styles.gradientValue}>{values[token] ?? "…"}</code>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- category */

const CATEGORY_ROWS = [
  {
    label: "Must-Do (red)",
    bg: "--must-do-bg",
    fg: "--must-do-fg",
    border: "--must-do-border",
    fill: "--must-do-bg-fill",
    fillSelected: "--must-do-bg-fill-selected",
  },
  {
    label: "Should-Do (yellow)",
    bg: "--should-do-bg",
    fg: "--should-do-fg",
    border: "--should-do-border",
    fill: "--should-do-bg-fill",
    fillSelected: "--should-do-bg-fill-selected",
  },
  {
    label: "Quick Win (green)",
    bg: "--quick-win-bg",
    fg: "--quick-win-fg",
    border: "--quick-win-border",
    fill: "--quick-win-bg-fill",
    fillSelected: "--quick-win-bg-fill-selected",
  },
  {
    label: "Support (habits / reminder)",
    bg: "--support-bg",
    fg: "--support-fg",
    border: "--support-border",
    fill: "--support-bg-fill",
    fillSelected: null,
  },
] as const;

export function CategoryTokens() {
  return (
    <div className={styles.categoryGrid}>
      {CATEGORY_ROWS.map((row) => (
        <div
          key={row.label}
          className={styles.categoryCard}
          style={{
            backgroundImage: `var(${row.fill})`,
            borderColor: `var(${row.border})`,
            color: `var(${row.fg})`,
          }}
        >
          <span className={styles.categoryLabel}>{row.label}</span>
          <span className={styles.categoryChips}>
            <span style={{ background: `var(${row.bg})` }} title={row.bg} />
            <span style={{ background: `var(${row.fg})` }} title={row.fg} />
            <span style={{ background: `var(${row.border})` }} title={row.border} />
          </span>
          <code className={styles.categoryTokenList}>
            {row.bg} · {row.fg} · {row.border}
          </code>
          {row.fillSelected ? (
            <span
              className={styles.categorySelectedStrip}
              style={{ backgroundImage: `var(${row.fillSelected})` }}
            >
              selected fill
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- typography */

const TYPE_ROLES = [
  { role: "display", sample: "Today", note: "Page titles" },
  { role: "title", sample: "Must-Dos", note: "Section / card headings" },
  { role: "body", sample: "Capture a thought and tap how much it matters.", note: "Primary copy" },
  { role: "caption", sample: "Sorted automatically a moment ago", note: "Metadata / hints" },
  { role: "label", sample: "Add to today", note: "Buttons, nav, form labels" },
  { role: "input", sample: "Renew passport on the 15th", note: "Form field text" },
  { role: "eyebrow", sample: "PRODUCT WALKTHROUGH", note: "Uppercase kickers" },
] as const;

const TYPE_SUBTOKENS = ["family", "size", "weight", "tracking", "leading"] as const;

export function TypeSpecimens() {
  const names = TYPE_ROLES.flatMap((r) =>
    TYPE_SUBTOKENS.map((s) => `--text-${r.role}-${s}`),
  );
  const values = useVarValues(names);

  return (
    <div className={styles.typeList}>
      {TYPE_ROLES.map(({ role, sample, note }) => (
        <div key={role} className={styles.typeRow}>
          <div className={styles.typeHead}>
            <code className={styles.swatchName}>--text-{role}</code>
            <span className={styles.typeNote}>{note}</span>
          </div>
          <p
            className={styles.typeSample}
            style={{
              font: `var(--text-${role})`,
              letterSpacing: `var(--text-${role}-tracking)`,
              textTransform: role === "eyebrow" ? "uppercase" : "none",
            }}
          >
            {sample}
          </p>
          <dl className={styles.typeSpec}>
            {TYPE_SUBTOKENS.map((s) => (
              <div key={s}>
                <dt>{s}</dt>
                <dd>{values[`--text-${role}-${s}`] ?? "…"}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ scales */

export function SpaceScale({ tokens }: { tokens: string[] }) {
  const values = useVarValues(tokens);
  return (
    <div className={styles.scaleList}>
      {tokens.map((token) => (
        <div key={token} className={styles.scaleRow}>
          <code className={styles.scaleName}>{token}</code>
          <span className={styles.scaleBarTrack}>
            <span
              className={styles.scaleBar}
              style={{ width: `var(${token})` }}
            />
          </span>
          <code className={styles.scaleValue}>{values[token] ?? "…"}</code>
        </div>
      ))}
    </div>
  );
}

export function RadiusScale({ tokens }: { tokens: string[] }) {
  const values = useVarValues(tokens);
  return (
    <div className={styles.radiusGrid}>
      {tokens.map((token) => (
        <div key={token} className={styles.radiusCard}>
          <span
            className={styles.radiusBox}
            style={{ borderRadius: `var(${token})` }}
          />
          <code className={styles.swatchName}>{token}</code>
          <code className={styles.swatchValue}>{values[token] ?? "…"}</code>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ motion */

const DURATIONS = [
  "--duration-fast",
  "--duration-base",
  "--duration-enter",
  "--duration-exit",
  "--duration-pop",
  "--duration-aha",
  "--duration-spring",
  "--duration-spin",
] as const;

const EASES = ["--ease-base", "--ease-spring", "--ease-overshoot"] as const;

export function MotionSpecimens() {
  const values = useVarValues([...DURATIONS, ...EASES]);
  const [nudge, setNudge] = useState(false);

  return (
    <div className={styles.motionWrap}>
      <button
        type="button"
        className={styles.motionToggle}
        onClick={() => setNudge((v) => !v)}
      >
        {nudge ? "Reset" : "Play"} transitions
      </button>

      <div className={styles.motionGroup}>
        <h3 className={styles.motionGroupTitle}>Durations</h3>
        {DURATIONS.map((token) => (
          <div key={token} className={styles.motionRow}>
            <code className={styles.scaleName}>{token}</code>
            <span className={styles.motionTrack}>
              <span
                className={styles.motionDot}
                style={{
                  transitionDuration: `var(${token})`,
                  transform: nudge ? "translateX(calc(100% - 1.5rem))" : "none",
                }}
              />
            </span>
            <code className={styles.scaleValue}>{values[token] ?? "…"}</code>
          </div>
        ))}
      </div>

      <div className={styles.motionGroup}>
        <h3 className={styles.motionGroupTitle}>Easings</h3>
        {EASES.map((token) => (
          <div key={token} className={styles.motionRow}>
            <code className={styles.scaleName}>{token}</code>
            <span className={styles.motionTrack}>
              <span
                className={styles.motionDot}
                style={{
                  transitionDuration: "700ms",
                  transitionTimingFunction: `var(${token})`,
                  transform: nudge ? "translateX(calc(100% - 1.5rem))" : "none",
                }}
              />
            </span>
            <code className={styles.scaleValue}>{values[token] ?? "…"}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- generic table */

export function TokenTable({ tokens }: { tokens: string[] }) {
  const values = useVarValues(tokens);
  return (
    <dl className={styles.tokenTable}>
      {tokens.map((token) => (
        <div key={token} className={styles.tokenTableRow}>
          <dt>
            <code>{token}</code>
          </dt>
          <dd>
            <code>{values[token] ?? "…"}</code>
          </dd>
        </div>
      ))}
    </dl>
  );
}

/* --------------------------------------------------------- live components */

export function ButtonShowcase() {
  return (
    <div className={styles.componentStack}>
      <div className={styles.componentRow}>
        <Button variant="primary">Add to today</Button>
        <Button variant="primary" disabled>
          Add to today
        </Button>
        <Button variant="secondary">Not now</Button>
        <Button variant="nav">Backlog</Button>
        <Button variant="nav" selected>
          Today
        </Button>
      </div>
      <div className={styles.componentRow}>
        <Button variant="category" category="red">
          Big deal
        </Button>
        <Button variant="category" category="yellow">
          It matters
        </Button>
        <Button variant="category" category="green">
          Eventually
        </Button>
      </div>
      <div className={styles.componentRow}>
        <Button variant="category" category="red" selected>
          Big deal (selected)
        </Button>
      </div>
    </div>
  );
}

export function FocusRingDemo() {
  return (
    <div className={styles.focusWrap}>
      <button type="button" className={styles.focusButton}>
        Tab to me — <code>--focus-ring</code>
      </button>
      <input
        className={styles.focusInput}
        placeholder="Focus me — --focus-ring-input + --shadow-focus"
      />
    </div>
  );
}
