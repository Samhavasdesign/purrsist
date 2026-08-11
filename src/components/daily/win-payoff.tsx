"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ToastShell } from "@/components/ui/toast-shell";
import { useToastAnchor } from "@/lib/ui/toast-anchor";
import styles from "./win-payoff.module.css";

export type WinPayoffVariant = "module" | "sheet";

type Props = {
  active: boolean;
  variant?: WinPayoffVariant;
  onDone: () => void;
};

const MODULE_PIECE_COUNT = 52;
const SHEET_PIECE_COUNT = MODULE_PIECE_COUNT * 10;

const COLORS = [
  "var(--accent)",
  "#e0b965",
  "#f4efe6",
  "#8fbf8a",
  "#e07a6a",
  "#c9a227",
];

const COPY: Record<WinPayoffVariant, string> = {
  module: "Great work! Today counts as a win. 🥳",
  sheet: "Everything's done for today! 🥳",
};

function buildPieces(count: number, mega: boolean) {
  return Array.from({ length: count }, (_, i) => {
    // Prefer a downward fan so pieces feel like they erupt from the logo.
    const angle =
      ((i / count) * 200 - 100 + (i % 7) * 4) * (Math.PI / 180);
    const distance =
      (mega ? 140 : 110) + ((i * 23) % (mega ? 320 : 180));
    const dx = Math.sin(angle) * distance * (mega ? 1.35 : 1);
    const dy =
      Math.cos(angle) * distance * 0.35 +
      (mega ? 90 : 70) +
      (i % 9) * (mega ? 28 : 22);
    return {
      dx,
      dy,
      delay: (i % (mega ? 36 : 14)) * (mega ? 16 : 20),
      duration: (mega ? 1600 : 1200) + ((i * 41) % (mega ? 1100 : 800)),
      size: (mega ? 4 : 5) + (i % (mega ? 8 : 6)),
      spin: (i * 53) % 360,
      color: COLORS[i % COLORS.length],
      round: i % 4 === 0,
    };
  });
}

/**
 * Confetti + toast when a module or the whole sheet flips to complete.
 */
export function WinPayoff({ active, variant = "module", onDone }: Props) {
  const [phase, setPhase] = useState<"idle" | "in" | "out">("idle");
  const [liveVariant, setLiveVariant] = useState<WinPayoffVariant>(variant);
  const platformAnchor = useToastAnchor();
  // Desktop: top-right under the nav; keep platform top/bottom on mobile.
  const anchor =
    platformAnchor === "bottom-right" ? "top-right" : platformAnchor;
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const mega = liveVariant === "sheet";
  const pieces = useMemo(
    () => buildPieces(mega ? SHEET_PIECE_COUNT : MODULE_PIECE_COUNT, mega),
    [mega],
  );

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      return;
    }

    setLiveVariant(variant);
    setPhase("in");
    const leaveMs = variant === "sheet" ? 3600 : 2400;
    const doneMs = variant === "sheet" ? 4200 : 3000;
    const leave = window.setTimeout(() => setPhase("out"), leaveMs);
    const done = window.setTimeout(() => onDoneRef.current(), doneMs);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, [active, variant]);

  if (!active && phase === "idle") return null;

  return (
    <div
      className={`${styles.layer} ${phase === "out" ? styles.leaving : ""}`}
      aria-hidden
    >
      <div className={styles.confetti}>
        {pieces.map((piece, i) => (
          <span
            key={`${liveVariant}-${i}`}
            className={`${styles.piece} ${piece.round ? styles.pieceRound : ""}`}
            style={{
              ["--dx" as string]: `${piece.dx}px`,
              ["--dy" as string]: `${piece.dy}px`,
              ["--delay" as string]: `${piece.delay}ms`,
              ["--duration" as string]: `${piece.duration}ms`,
              ["--size" as string]: `${piece.size}px`,
              ["--spin" as string]: `${piece.spin}deg`,
              ["--color" as string]: piece.color,
            }}
          />
        ))}
      </div>

      <ToastShell className={styles.toast} anchor={anchor}>
        <p className={styles.toastTitle}>{COPY[liveVariant]}</p>
      </ToastShell>
    </div>
  );
}
