import type { Metadata } from "next";
import {
  ButtonShowcase,
  CategoryTokens,
  ColorSwatches,
  FocusRingDemo,
  GradientSwatches,
  MotionSpecimens,
  RadiusScale,
  SpaceScale,
  TokenTable,
  TypeSpecimens,
} from "./tokens-explorer";
import styles from "./design-system.module.css";

export const metadata: Metadata = {
  title: "Design system",
};

const SEMANTIC_COLORS = [
  "--background",
  "--foreground",
  "--surface",
  "--border",
  "--muted",
  "--accent",
  "--accent-hover",
  "--accent-foreground",
  "--accent-soft",
  "--danger",
  "--success",
  "--surface-glass",
  "--border-muted",
];

const GRADIENTS = ["--background-fill"];

const SPACE_TOKENS = [
  "--space-1",
  "--space-2",
  "--space-3",
  "--space-4",
  "--space-5",
  "--space-6",
  "--space-7",
  "--space-8",
  "--space-10",
  "--space-12",
  "--space-16",
];

const RADIUS_TOKENS = ["--radius-sm", "--radius-md", "--radius-lg", "--radius-full"];

const BORDER_TOKENS = [
  "--border-width",
  "--border-style",
  "--border-default",
  "--border-muted-default",
];

const FONT_TOKENS = ["--font-display", "--font-ui"];

const DENSE_TEXT_TOKENS = ["--text-caption-sm", "--text-caption-xs"];

const BUTTON_TOKENS = [
  "--btn-height",
  "--btn-pad-x",
  "--btn-pad-x-compact",
  "--btn-radius-pill",
  "--btn-radius-soft",
  "--btn-radius-category",
  "--btn-icon-size",
  "--btn-icon-size-lg",
  "--check-size",
];

const FOCUS_TOKENS = [
  "--focus-ring",
  "--focus-ring-offset",
  "--focus-ring-input",
  "--focus-ring-input-offset",
  "--shadow-focus",
  "--btn-focus-ring",
  "--btn-focus-offset",
];

const LAYOUT_TOKENS = [
  "--app-content-max",
  "--app-content-pad-x",
  "--app-content-pad-top",
  "--app-content-pad-bottom",
];

function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id} className={styles.sectionTitle}>
        {title}
      </h2>
      {note ? <p className={styles.sectionNote}>{note}</p> : null}
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Reference</p>
        <h1 className={styles.title}>Design system</h1>
        <p className={styles.subtitle}>
          Every token from <code>src/styles/tokens.css</code>, read live from the
          running app&#8217;s computed styles. If a value looks wrong here, the
          token is wrong &#8212; this page cannot drift from source. See{" "}
          <code>design-system-audit.md</code> for the full inventory and roadmap.
        </p>
      </header>

      <Section
        id="color"
        title="Color — semantic"
        note="Core palette. Light is the active default; a dark block exists in tokens.css but no data-theme is set on the document yet."
      >
        <ColorSwatches tokens={SEMANTIC_COLORS} />
      </Section>

      <Section
        id="washes"
        title="Page wash"
        note="Layered background gradient painted on <body>."
      >
        <GradientSwatches tokens={GRADIENTS} />
      </Section>

      <Section
        id="category"
        title="Category tokens"
        note="Full-bleed Must-Do / Should-Do / Quick Win blocks plus the Support wash for Habits and the Daily Reminder. Each card below is painted with its own -bg-fill gradient and -border; the chips are bg / fg / border."
      >
        <CategoryTokens />
      </Section>

      <Section
        id="type"
        title="Typography — roles"
        note="One definition per role. Restyle a role in tokens.css and every usage follows. Consume as: font: var(--text-<role>); letter-spacing: var(--text-<role>-tracking);"
      >
        <TypeSpecimens />
        <h3 className={styles.subhead}>Font families</h3>
        <TokenTable tokens={FONT_TOKENS} />
        <h3 className={styles.subhead}>Dense size-only tokens</h3>
        <TokenTable tokens={DENSE_TEXT_TOKENS} />
      </Section>

      <Section
        id="space"
        title="Spacing scale"
        note="4px base unit. Prefer these steps for gap / padding / margin in new CSS."
      >
        <SpaceScale tokens={SPACE_TOKENS} />
      </Section>

      <Section
        id="radius"
        title="Radius scale"
        note="Four steps only. sm: checkboxes, badges. md: inputs, buttons, task rows. lg: cards, banners. full: category pills + segmented nav only."
      >
        <RadiusScale tokens={RADIUS_TOKENS} />
      </Section>

      <Section
        id="border"
        title="Borders"
        note="Solid for controls / cards / structure. Dotted / dashed only for empty slots and drop zones."
      >
        <TokenTable tokens={BORDER_TOKENS} />
      </Section>

      <Section
        id="motion"
        title="Motion"
        note="One timing scale for every micro-interaction and keyframe. base is the universal default. Press Play to run each duration and easing."
      >
        <MotionSpecimens />
      </Section>

      <Section
        id="buttons"
        title="Buttons & controls"
        note="Shared geometry for every interactive variant — hierarchy comes from variant styles, not one-off sizes. Live <Button> components below."
      >
        <ButtonShowcase />
        <h3 className={styles.subhead}>Geometry tokens</h3>
        <TokenTable tokens={BUTTON_TOKENS} />
      </Section>

      <Section
        id="focus"
        title="Focus rings"
        note="Always distinct from resting borders — outline + offset, never a recolored border alone."
      >
        <FocusRingDemo />
        <h3 className={styles.subhead}>Focus tokens</h3>
        <TokenTable tokens={FOCUS_TOKENS} />
      </Section>

      <Section
        id="layout"
        title="Layout grid"
        note="Keeps app screens and the top bar aligned. Pad values step up at the 640px breakpoint."
      >
        <TokenTable tokens={LAYOUT_TOKENS} />
      </Section>
    </main>
  );
}
