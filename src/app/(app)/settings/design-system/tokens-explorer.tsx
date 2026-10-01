"use client";

/*
 * Living token explorer. Every value shown here is read from the actual
 * computed styles of :root at runtime, so this page can never drift from
 * src/styles/tokens.css — if a token changes, this reflects it on reload.
 */

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { ViewTabs } from "@/components/ui/view-tabs";
import {
  CatHeadIcon,
  ChevronLeftIcon,
  CloseIcon,
  GripIcon,
  InfoIcon,
  PlusIcon,
} from "@/components/icons";
import { KIND_LABELS } from "@/lib/types/database";
import dash from "@/components/daily/daily-dashboard.module.css";
import habits from "@/components/habits/habits-page.module.css";
import auth from "@/components/auth/auth-form.module.css";
import addToBacklog from "@/components/daily/add-to-backlog.module.css";
import archivePicker from "@/components/archive/archive-date-picker.module.css";
import backlog from "@/components/backlog/backlog.module.css";
import topBar from "@/components/nav/app-top-bar.module.css";
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
    prefix: "--must-do",
    bg: "--must-do-bg",
    fg: "--must-do-fg",
    border: "--must-do-border",
    fill: "--must-do-bg-fill",
  },
  {
    label: "Should-Do (yellow)",
    prefix: "--should-do",
    bg: "--should-do-bg",
    fg: "--should-do-fg",
    border: "--should-do-border",
    fill: "--should-do-bg-fill",
  },
  {
    label: "Quick Win (green)",
    prefix: "--quick-win",
    bg: "--quick-win-bg",
    fg: "--quick-win-fg",
    border: "--quick-win-border",
    fill: "--quick-win-bg-fill",
  },
  {
    label: "Support (habits / reminder)",
    prefix: "--support",
    bg: "--support-bg",
    fg: "--support-fg",
    border: "--support-border",
    fill: "--support-bg-fill",
  },
] as const;

const SHADES = ["tint", "soft"] as const;

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
          <span className={styles.categoryChips}>
            {SHADES.map((shade) => (
              <span
                key={shade}
                style={{ background: `var(${row.prefix}-${shade})` }}
                title={`${row.prefix}-${shade}`}
              />
            ))}
          </span>
          <code className={styles.categoryTokenList}>
            {SHADES.map((shade) => `${row.prefix}-${shade}`).join(" · ")}
          </code>
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
      <div>
        <Button variant="secondary" onClick={() => setNudge((v) => !v)}>
          {nudge ? "Reset" : "Play"} transitions
        </Button>
      </div>

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

/* ---------------------------------------------------------------- geometry */

type GeometryKind = "height" | "pad" | "radius" | "check" | "transition";

const GEOMETRY: { token: string; kind: GeometryKind; note: string }[] = [
  { token: "--btn-height", kind: "height", note: "Minimum height of every button" },
  { token: "--btn-pad-x", kind: "pad", note: "Side padding: primary, nav" },
  { token: "--btn-pad-x-compact", kind: "pad", note: "Side padding: secondary" },
  { token: "--btn-radius-pill", kind: "radius", note: "Nav buttons" },
  { token: "--btn-radius-soft", kind: "radius", note: "Primary, secondary, icon" },
  { token: "--btn-radius-category", kind: "radius", note: "Category buttons" },
  { token: "--check-size", kind: "check", note: "Checkboxes and check indicators" },
  { token: "--btn-transition", kind: "transition", note: "Hover to play" },
];

function GeometryDemo({ token, kind }: { token: string; kind: GeometryKind }) {
  switch (kind) {
    case "height":
      return (
        <span className={styles.geoHeightWrap}>
          <span className={styles.geoHeightRule} style={{ height: `var(${token})` }} />
          <span className={styles.geoButton} style={{ minHeight: `var(${token})` }}>
            Add to today
          </span>
        </span>
      );
    case "pad":
      return (
        <span
          className={`${styles.geoButton} ${styles.geoPad}`}
          style={{ paddingInline: `var(${token})` }}
        >
          <span className={styles.geoPadLabel}>Label</span>
        </span>
      );
    case "radius":
      return <span className={styles.geoRadius} style={{ borderRadius: `var(${token})` }} />;
    case "check":
      return (
        <span className={styles.geoCheckWrap}>
          <span
            className={styles.geoCheck}
            style={{ width: `var(${token})`, height: `var(${token})` }}
          />
          <span className={styles.geoCheckZoom}>
            <span
              className={styles.geoCheck}
              style={{ width: `calc(var(${token}) * 3)`, height: `calc(var(${token}) * 3)` }}
            />
            ×3
          </span>
        </span>
      );
    case "transition":
      return (
        <span className={`${styles.geoButton} ${styles.geoTransition}`} tabIndex={0}>
          Hover me
        </span>
      );
  }
}

export function GeometrySpecimens() {
  const values = useVarValues(GEOMETRY.map((g) => g.token));
  return (
    <div className={styles.geoGrid}>
      {GEOMETRY.map(({ token, kind, note }) => (
        <div
          key={token}
          className={`${styles.geoCard} ${kind === "transition" ? styles.geoWide : ""}`}
        >
          <div className={styles.geoStage}>
            <GeometryDemo token={token} kind={kind} />
          </div>
          <code className={styles.swatchName}>{token}</code>
          <code className={styles.swatchValue}>{values[token] ?? "…"}</code>
          <span className={styles.geoNote}>{note}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ inputs */

/*
 * Every field family in the app, rendered with its real module classes.
 * :focus can't be forced on more than one element, so "Focus" tiles copy the
 * shared focus rule inline (accent border + --shadow-focus for boxed fields,
 * the row border for row fields) — click any other tile to see the real one.
 */
const FOCUS_HALO = { borderColor: "var(--accent)", boxShadow: "var(--shadow-focus)" };
function StateTile({ state, children }: { state: string; children: React.ReactNode }) {
  return (
    <div className={styles.inputTile}>
      <span className={styles.inputState}>{state}</span>
      {children}
    </div>
  );
}

export function InputStates() {
  return (
    <div className={styles.inputFamilies}>
      <div className={styles.inputFamily}>
        <h3 className={styles.subhead}>Boxed field</h3>
        <p className={styles.typeNote}>
          Sign in, sign up, save account. <code>auth-form .input</code>
        </p>
        <div className={styles.inputGrid}>
          <StateTile state="Default">
            <input className={auth.input} defaultValue="alex@example.com" aria-label="Email" />
          </StateTile>
          <StateTile state="Placeholder">
            <input className={auth.input} placeholder="you@example.com" aria-label="Email" />
          </StateTile>
          <StateTile state="Focus">
            <input
              className={auth.input}
              defaultValue="alex@example.com"
              style={FOCUS_HALO}
              aria-label="Email"
            />
          </StateTile>
          <StateTile state="Error">
            <div className={auth.field}>
              <input className={auth.input} defaultValue="alex@example" aria-label="Email" />
              <p className={auth.error}>Enter a valid email address.</p>
            </div>
          </StateTile>
          <StateTile state="Warning">
            <div className={auth.field}>
              <input className={auth.input} defaultValue="alex@example.con" aria-label="Email" />
              <p className={auth.warning}>Did you mean alex@example.com?</p>
            </div>
          </StateTile>
          <StateTile state="Success">
            <div className={auth.field}>
              <input className={auth.input} defaultValue="alex@example.com" aria-label="Email" />
              <p className={auth.message}>Check your email for a sign-in link.</p>
            </div>
          </StateTile>
        </div>
      </div>

      <div className={styles.inputFamily}>
        <h3 className={styles.subhead}>Capture field</h3>
        <p className={styles.typeNote}>
          Add to backlog on Today. <code>add-to-backlog .input</code>
        </p>
        <div className={styles.inputGrid}>
          <StateTile state="Placeholder">
            <textarea className={addToBacklog.input} rows={1} placeholder="What's on your mind?" aria-label="Capture" />
          </StateTile>
          <StateTile state="Filled">
            <textarea className={addToBacklog.input} rows={1} defaultValue="Book the vet" aria-label="Capture" />
          </StateTile>
          <StateTile state="Focus">
            <textarea
              className={addToBacklog.input}
              rows={1}
              defaultValue="Book the vet"
              style={FOCUS_HALO}
              aria-label="Capture"
            />
          </StateTile>
          <StateTile state="Disabled (saving)">
            <textarea className={addToBacklog.input} rows={1} defaultValue="Book the vet" disabled aria-label="Capture" />
          </StateTile>
          <StateTile state="Error">
            <div className={addToBacklog.panel}>
              <textarea className={addToBacklog.input} rows={1} defaultValue="Book the vet" aria-label="Capture" />
              <p className={addToBacklog.error}>Couldn&#8217;t save. Try again.</p>
            </div>
          </StateTile>
          <StateTile state="Warning">
            <div className={addToBacklog.panel}>
              <textarea className={addToBacklog.input} rows={1} defaultValue="Book the vet" aria-label="Capture" />
              <p className={addToBacklog.warning}>Already in your backlog.</p>
            </div>
          </StateTile>
        </div>
      </div>

      <div className={styles.inputFamily}>
        <h3 className={styles.subhead}>Select</h3>
        <p className={styles.typeNote}>
          Archive day picker. <code>archive-date-picker .select</code>
        </p>
        <div className={styles.inputGrid}>
          <StateTile state="Default">
            <select className={archivePicker.select} defaultValue="" aria-label="Browse a past day">
              <option value="">Select a date…</option>
              <option value="d">Monday, Sep 28</option>
            </select>
          </StateTile>
          <StateTile state="Focus">
            <select
              className={archivePicker.select}
              defaultValue=""
              style={FOCUS_HALO}
              aria-label="Browse a past day"
            >
              <option value="">Select a date…</option>
            </select>
          </StateTile>
        </div>
      </div>

      <div className={styles.inputFamily}>
        <h3 className={styles.subhead}>Today row</h3>
        <p className={styles.typeNote}>
          Borderless input inside a tinted row; the row takes focus. <code>slotRow / slotInput</code>
        </p>
        <div className={`${dash.section} ${dash.section_red} ${styles.inputRows}`}>
          <StateRow label="Empty">
            <ul className={dash.slotList}>
              <li className={dash.slotRow}>
                <input type="checkbox" className={dash.checkbox} disabled aria-label="Empty slot" />
                <div className={dash.slotFields}>
                  <input className={dash.slotInput} placeholder="Add a Must-Do" aria-label="Must-Do" />
                </div>
              </li>
            </ul>
          </StateRow>
          <StateRow label="Filled">
            <ul className={dash.slotList}>
              <li className={dash.slotRow}>
                <input type="checkbox" className={dash.checkbox} aria-label="Complete" />
                <div className={dash.slotFields}>
                  <input className={dash.slotInput} defaultValue="Renew passport" aria-label="Must-Do" />
                </div>
              </li>
            </ul>
          </StateRow>
          <StateRow label="Focus">
            <ul className={dash.slotList}>
              <li className={dash.slotRow} style={{ borderColor: "var(--must-do-border)" }}>
                <input type="checkbox" className={dash.checkbox} aria-label="Complete" />
                <div className={dash.slotFields}>
                  <input className={dash.slotInput} defaultValue="Renew passport" aria-label="Must-Do" />
                </div>
              </li>
            </ul>
          </StateRow>
          <StateRow label="Done">
            <ul className={dash.slotList}>
              <li className={dash.slotRow}>
                <input type="checkbox" className={dash.checkbox} defaultChecked aria-label="Complete" />
                <div className={dash.slotFields}>
                  <input
                    className={`${dash.slotInput} ${dash.slotDone}`}
                    defaultValue="Renew passport"
                    aria-label="Must-Do"
                  />
                </div>
              </li>
            </ul>
          </StateRow>
        </div>
        <div className={styles.inputGrid}>
          <StateTile state="Error">
            <p className={dash.error}>
              Couldn&#8217;t save that change. Check your connection and try again.
            </p>
          </StateTile>
          <StateTile state="Warning">
            <p className={dash.warning}>You&#8217;re offline. Changes will save when you reconnect.</p>
          </StateTile>
        </div>
      </div>

      <div className={styles.inputFamily}>
        <h3 className={styles.subhead}>Backlog &amp; Habits row</h3>
        <p className={styles.typeNote}>
          Same idea on the support card; dashed = unsaved draft. <code>item / itemTextInput</code>
        </p>
        <div className={`${backlog.section} ${styles.inputRows}`}>
          <StateRow label="Draft">
            <div className={`${backlog.item} ${backlog.itemDraft}`}>
              <textarea className={backlog.itemTextInput} rows={1} placeholder="Type here..." aria-label="New item" />
            </div>
          </StateRow>
          <StateRow label="Filled">
            <div className={backlog.item}>
              <textarea className={backlog.itemTextInput} rows={1} defaultValue="Call the landlord" aria-label="Item" />
            </div>
          </StateRow>
          <StateRow label="Focus">
            <div className={backlog.item} style={{ borderColor: "var(--support-border)" }}>
              <textarea className={backlog.itemTextInput} rows={1} defaultValue="Call the landlord" aria-label="Item" />
            </div>
          </StateRow>
          <StateRow label="Disabled">
            <div className={backlog.item}>
              <textarea className={backlog.itemTextInput} rows={1} defaultValue="Call the landlord" disabled aria-label="Item" />
            </div>
          </StateRow>
          <StateRow label="Error">
            <div className={backlog.item}>
              <textarea className={backlog.itemTextInput} rows={1} defaultValue="" aria-label="Item" />
              <p className={backlog.itemError}>Name required</p>
            </div>
          </StateRow>
          <StateRow label="Warning">
            <div className={backlog.item}>
              <textarea className={backlog.itemTextInput} rows={1} defaultValue="Call the landlord" aria-label="Item" />
              <p className={backlog.itemWarning}>This one has been here 5 days.</p>
            </div>
          </StateRow>
        </div>
      </div>
    </div>
  );
}

function StateRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.inputStateRow}>
      <span className={styles.inputState}>{label}</span>
      <div className={styles.inputStateBody}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------- breakpoints */

/*
 * Media queries can't read CSS custom properties, so breakpoints live as
 * literals in each module. This list is the inventory; keep it in sync when
 * a new @media width is added.
 */
const BREAKPOINTS = [
  {
    name: "Phone",
    query: "(max-width: 639px)",
    role: "Toast anchor flips to a top banner (iOS) or bottom snackbar; win payoff layout.",
    where: "toast-anchor.ts (JS), win-payoff",
  },
  {
    name: "Tablet & up",
    query: "(min-width: 640px)",
    role: "The app breakpoint. Content padding steps up (--app-content-pad-x / -top), top bar, auth, collection, stagnant-task prompt.",
    where: "tokens.css, app-top-bar, auth-shell, collection-screen, stagnant-tasks-prompt, home",
  },
  {
    name: "Landing: two-column hero",
    query: "(min-width: 900px)",
    role: "Marketing hero splits into copy + Today preview.",
    where: "home",
  },
  {
    name: "Landing: wide",
    query: "(min-width: 1200px)",
    role: "Marketing hero gap widens.",
    where: "home",
  },
  {
    name: "Off-scale",
    query: "(max-width: 560px)",
    role: "One-off: stacks the How it works flow and this page's scale rows. Not on the 640 grid.",
    where: "how-it-works, design-system",
  },
] as const;

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function readMatches(): string {
  return BREAKPOINTS.map((bp) => (window.matchMedia(bp.query).matches ? "1" : "0")).join("");
}

export function BreakpointList() {
  const matches = useSyncExternalStore(subscribeResize, readMatches, () => "");
  const width = useSyncExternalStore(
    subscribeResize,
    () => window.innerWidth,
    () => 0,
  );

  return (
    <div className={styles.bpWrap}>
      <p className={styles.bpNow}>
        Viewport now: <code>{width ? `${width}px` : "…"}</code>
      </p>
      <div className={styles.bpList}>
        {BREAKPOINTS.map((bp, i) => {
          const active = matches[i] === "1";
          return (
            <div key={bp.query} className={styles.bpRow}>
              <div className={styles.bpHead}>
                <span className={styles.bpName}>{bp.name}</span>
                <span className={active ? styles.bpOn : styles.bpOff}>
                  {active ? "Matches now" : "Not active"}
                </span>
              </div>
              <code className={styles.swatchName}>@media {bp.query}</code>
              <span className={styles.typeNote}>{bp.role}</span>
              <code className={styles.swatchValue}>{bp.where}</code>
            </div>
          );
        })}
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

/* The category variant's only home: the Backlog "Move to today" priority
   picker (backlog-item-row), at the variant's own compact sizing. */
const PRIORITY_OPTIONS = [
  { kind: "must_do", tone: "red" },
  { kind: "should_do", tone: "yellow" },
  { kind: "quick_win", tone: "green" },
] as const;

function PriorityPickerDemo() {
  const [picked, setPicked] = useState<string>("must_do");
  return (
    <div className={backlog.promoteBlock}>
      <p className={backlog.promoteLabel}>Priority</p>
      <div className={backlog.promoteSigRow} role="group" aria-label="Priority">
        {PRIORITY_OPTIONS.map(({ kind, tone }) => {
          const label = KIND_LABELS[kind];
          return (
            <Button
              key={kind}
              variant="category"
              category={tone}
              selected={picked === kind}
              aria-pressed={picked === kind}
              onClick={() => setPicked(kind)}
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

type ButtonSpec = {
  variant: string;
  name: string;
  usage: string;
  states: { state: string; node: React.ReactNode; note?: string }[];
  extra?: React.ReactNode;
  tokens: { token: string; role: string }[];
};

const BUTTON_SPECS: ButtonSpec[] = [
  {
    variant: "primary",
    name: "Primary",
    usage:
      "The one main action in a flow: Add (capture), Confirm (move to today), Review / Save in backlog (stagnant tasks), Check all (end-of-day sheet), Sign in / Create account / Save my account.",
    states: [
      { state: "Default", node: <Button variant="primary">Add</Button> },
      { state: "Active", node: null, note: "No selected state. Pressing nudges it down 0.5px." },
      {
        state: "Disabled",
        node: (
          <Button variant="primary" disabled>
            Add
          </Button>
        ),
      },
    ],
    tokens: [
      { token: "--foreground", role: "Fill" },
      { token: "--background", role: "Label" },
      { token: "--btn-pad-x", role: "Side padding" },
      { token: "--btn-radius-soft", role: "Corners" },
      { token: "--text-label-weight", role: "Label weight" },
    ],
  },
  {
    variant: "secondary",
    name: "Secondary",
    usage:
      "The quieter choice beside a primary, or a low-key link-like action: Not now, Later, Cancel, Archive, Maybe later, Manage habits, + N more.",
    states: [
      { state: "Default", node: <Button variant="secondary">Not now</Button> },
      { state: "Active", node: null, note: "No selected state." },
      {
        state: "Disabled",
        node: (
          <Button variant="secondary" disabled>
            Not now
          </Button>
        ),
      },
    ],
    tokens: [
      { token: "--muted", role: "Label" },
      { token: "--foreground", role: "Hover label + 6% wash" },
      { token: "--btn-pad-x-compact", role: "Side padding" },
      { token: "--btn-radius-soft", role: "Corners" },
    ],
  },
  {
    variant: "nav",
    name: "Nav",
    usage: "The floating bottom navigation only: Today and Backlog. selected marks the current screen.",
    states: [
      { state: "Default", node: <Button variant="nav">Backlog</Button> },
      {
        state: "Active",
        node: (
          <Button variant="nav" selected>
            Today
          </Button>
        ),
        note: "Current screen (selected).",
      },
      { state: "Disabled", node: null, note: "Styled in CSS but never used." },
    ],
    tokens: [
      { token: "--muted", role: "Resting label" },
      { token: "--foreground", role: "Selected fill" },
      { token: "--background", role: "Selected label" },
      { token: "--btn-radius-pill", role: "Corners" },
    ],
  },
  {
    variant: "category",
    name: "Category",
    usage:
      "The Backlog \u201cMove to today\u201d priority picker only. Selected = flat tint + category-ink border. A section with no free slot stays pickable \u2014 the task lands as an extra, and the tooltip says so.",
    states: [
      {
        state: "Default",
        node: (
          <Button variant="category" category="yellow">
            {KIND_LABELS.should_do}
          </Button>
        ),
      },
      {
        state: "Active",
        node: (
          <Button variant="category" category="red" selected aria-pressed>
            {KIND_LABELS.must_do}
          </Button>
        ),
        note: "Picked priority (selected).",
      },
      {
        state: "Disabled",
        node: (
          <Button variant="category" category="green" disabled>
            {KIND_LABELS.quick_win}
          </Button>
        ),
        note: "While the move is saving.",
      },
    ],
    extra: <PriorityPickerDemo />,
    tokens: [
      { token: "--must-do-bg-fill", role: "Resting fill (per category)" },
      { token: "--must-do-fg", role: "Label + selected border" },
      { token: "--must-do-tint", role: "Selected fill" },
      { token: "--btn-radius-category", role: "Corners" },
      { token: "--text-caption-sm", role: "Label size (Fraunces)" },
    ],
  },
];

const SHARED_BUTTON_TOKENS = [
  "--btn-height",
  "--text-label-size",
  "--btn-focus-ring",
  "--btn-focus-offset",
];

function ButtonSpecCard({ spec }: { spec: ButtonSpec }) {
  const values = useVarValues(spec.tokens.map((t) => t.token));
  return (
    <div className={styles.btnSpec}>
      <div className={styles.btnSpecHead}>
        <span className={styles.bpName}>{spec.name}</span>
        <code className={styles.swatchName}>variant=&quot;{spec.variant}&quot;</code>
      </div>
      <p className={styles.typeNote}>{spec.usage}</p>
      <div className={styles.btnStates}>
        {spec.states.map(({ state, node, note }) => (
          <div key={state} className={styles.inputTile}>
            <span className={styles.inputState}>{state}</span>
            {node ?? <span className={styles.btnNa}>—</span>}
            {note ? <span className={styles.geoNote}>{note}</span> : null}
          </div>
        ))}
      </div>
      {spec.extra ? (
        <div className={styles.inputTile}>
          <span className={styles.inputState}>Live picker</span>
          {spec.extra}
        </div>
      ) : null}
      <dl className={styles.btnTokens}>
        {spec.tokens.map(({ token, role }) => (
          <div key={token}>
            <dt>{role}</dt>
            <dd>
              <code className={styles.swatchName}>{token}</code>
              <code className={styles.swatchValue}>{values[token] ?? "…"}</code>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ButtonShowcase() {
  const shared = useVarValues(SHARED_BUTTON_TOKENS);
  return (
    <div className={styles.componentStack}>
      <p className={styles.typeNote}>
        Every variant shares{" "}
        {SHARED_BUTTON_TOKENS.map((t, i) => (
          <span key={t}>
            {i ? ", " : ""}
            <code>{t}</code> ({shared[t] ?? "…"})
          </span>
        ))}
        .
      </p>
      {BUTTON_SPECS.map((spec) => (
        <ButtonSpecCard key={spec.variant} spec={spec} />
      ))}
    </div>
  );
}

const TODAY_SECTIONS = [
  { tone: dash.section_red, title: "Must-Dos", hint: "Hot tickets.", kind: "must_do", tasks: ["Renew passport"] },
  { tone: dash.section_yellow, title: "Should-Dos", hint: "Medium urgency.", kind: "should_do", tasks: ["Book the dentist"] },
  { tone: dash.section_green, title: "Quick Wins", hint: "Small stuff, done fast.", kind: "quick_win", tasks: ["Water the plants"] },
] as const;

/** Today modules built from the real dashboard styles, so every shade matches. */
export function TodaySectionSpecimens() {
  return (
    <div className={styles.componentStack}>
      {TODAY_SECTIONS.map((section) => (
        <div key={section.kind} className={`${dash.section} ${section.tone}`}>
          <div className={dash.sectionHead}>
            <div className={dash.sectionTitleRow}>
              <div className={dash.sectionTitleCluster}>
                <div className={dash.sectionTitleMain}>
                  <h3 className={dash.sectionTitle}>{section.title}</h3>
                  <p className={dash.sectionHint}>{section.hint}</p>
                </div>
              </div>
              <IconButton
                label={`Add ${KIND_LABELS[section.kind]}`}
                icon={<PlusIcon />}
                className={dash.addSlotBtn}
              />
            </div>
          </div>
          <ul className={dash.slotList}>
            {[...section.tasks, ""].map((task) => (
              <li key={task || "empty"} className={dash.slotRow}>
                <input
                  type="checkbox"
                  className={dash.checkbox}
                  aria-label={task ? `Complete ${task}` : "Empty slot"}
                  disabled={!task}
                />
                <div className={dash.slotFields}>
                  <input
                    type="text"
                    className={dash.slotInput}
                    defaultValue={task}
                    placeholder={`Add a ${KIND_LABELS[section.kind]}`}
                    aria-label={`${KIND_LABELS[section.kind]} text`}
                  />
                </div>
                {task ? (
                  <IconButton
                    label="Remove task"
                    icon={<CloseIcon />}
                    tone="ghost"
                    className={dash.clearBtn}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* Every IconButton in the app is restyled by its call site, so each demo below
   sits inside the real parent class and uses the real override class. */
const ICON_CATEGORY_TONES = [
  ["Must-Do", dash.section_red],
  ["Should-Do", dash.section_yellow],
  ["Quick Win", dash.section_green],
  ["Daily Reminder", dash.section_support],
] as const;

export function IconButtonShowcase() {
  return (
    <div className={styles.iconContexts}>
      <div className={styles.iconContext}>
        <span className={styles.geoNote}>
          Today modules: add (<code>addSlotBtn</code>) and remove (<code>clearBtn</code>)
        </span>
        <div className={styles.iconToneGrid}>
          {ICON_CATEGORY_TONES.map(([name, tone]) => (
            <div key={name} className={`${dash.section} ${tone} ${styles.iconToneCard}`}>
              <span className={dash.sectionTitle}>{name}</span>
              <span className={styles.componentRow}>
                <IconButton label={`Add ${name}`} icon={<PlusIcon />} className={dash.addSlotBtn} />
                <IconButton
                  label="Remove task"
                  icon={<CloseIcon />}
                  tone="ghost"
                  className={dash.clearBtn}
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.iconContext}>
        <span className={styles.geoNote}>
          Backlog and Habits: add on the support card (<code>addBtn</code>)
        </span>
        <div className={`${habits.section} ${styles.iconToneCard}`}>
          <span className={styles.componentRow}>
            <IconButton label="Add habit" icon={<PlusIcon />} className={habits.addBtn} />
            <IconButton label="Add habit" icon={<PlusIcon />} className={habits.addBtn} disabled />
          </span>
        </div>
      </div>

      <div className={styles.iconContext}>
        <span className={styles.geoNote}>
          Top bar: back, and the info button resting and on its own page (<code>navControl</code>)
        </span>
        <div className={styles.iconTopBar}>
          <div className={topBar.left}>
            <IconButton
              label="Back"
              icon={<ChevronLeftIcon />}
              iconSize={24}
              tone="ghost"
              className={topBar.backBtn}
            />
          </div>
          <div className={topBar.right}>
            <IconButton label="About Purrsist" icon={<InfoIcon />} className={topBar.navControl} />
            <IconButton
              label="About Purrsist"
              icon={<InfoIcon />}
              active
              aria-current="page"
              className={topBar.navControl}
            />
          </div>
        </div>
      </div>

      <div className={styles.iconContext}>
        <span className={styles.geoNote}>
          Plain ghost remove: habit rows, archived items, due reminders
        </span>
        <span className={styles.componentRow}>
          <IconButton label="Remove" icon={<CloseIcon />} tone="ghost" />
          <IconButton label="Remove" icon={<CloseIcon />} tone="ghost" disabled />
        </span>
      </div>
    </div>
  );
}

export function ViewTabsShowcase() {
  const [view, setView] = useState<"active" | "archived">("active");
  return (
    <ViewTabs
      value={view}
      onChange={setView}
      ariaLabel="Example view"
      options={[
        { value: "active", label: "Active" },
        { value: "archived", label: "Archived" },
      ]}
    />
  );
}

const ICONS = [
  ["PlusIcon", PlusIcon],
  ["CloseIcon", CloseIcon],
  ["ChevronLeftIcon", ChevronLeftIcon],
  ["InfoIcon", InfoIcon],
  ["GripIcon", GripIcon],
  ["CatHeadIcon", CatHeadIcon],
] as const;

export function IconGallery() {
  return (
    <div className={styles.iconGrid}>
      {ICONS.map(([name, Icon]) => (
        <div key={name} className={styles.iconCell}>
          <span className={styles.iconGlyphs}>
            <Icon size={20} />
            <Icon size={24} />
          </span>
          <code className={styles.swatchName}>{name}</code>
        </div>
      ))}
    </div>
  );
}

export function FocusRingDemo() {
  return (
    <div className={styles.focusWrap}>
      <Button variant="secondary">Tab to me</Button>
      <input
        className={styles.focusInput}
        placeholder="Focus me — --focus-ring-input + --shadow-focus"
      />
    </div>
  );
}
