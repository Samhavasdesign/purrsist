import styles from "./backlog.module.css";
import type { Significance } from "@/lib/types/database";

const LABELS: Record<Significance, string> = {
  red: "Big deal",
  yellow: "Matters",
  green: "Eventually",
};

export function SignificanceDot({
  value,
}: {
  value: Significance | null;
}) {
  if (!value) {
    return (
      <span
        className={`${styles.sigDot} ${styles.sig_unset}`}
        title="Unassigned"
        aria-label="Unassigned"
      />
    );
  }

  return (
    <span
      className={`${styles.sigDot} ${styles[`sig_${value}`]}`}
      title={LABELS[value]}
      aria-label={LABELS[value]}
    />
  );
}
