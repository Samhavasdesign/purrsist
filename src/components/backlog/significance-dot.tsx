import styles from "./backlog.module.css";
import type { Significance } from "@/lib/types/database";

const LABELS: Record<Significance, string> = {
  red: "Big deal",
  yellow: "Matters",
  green: "Eventually",
};

export function SignificanceDot({ value }: { value: Significance }) {
  return (
    <span
      className={`${styles.sigDot} ${styles[`sig_${value}`]}`}
      title={LABELS[value]}
      aria-label={LABELS[value]}
    />
  );
}
