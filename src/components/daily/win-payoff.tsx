"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./win-payoff.module.css";

type Props = {
  active: boolean;
  onDone: () => void;
};

const PIECE_COUNT = 52;
const COLORS = [
  "var(--accent)",
  "#e0b965",
  "#f4efe6",
  "#8fbf8a",
  "#e07a6a",
  "#c9a227",
];

/**
 * Confetti + toast when the day flips to a win (PRD §7 Day outcome).
 */
export function WinPayoff({ active, onDone }: Props) {
  const [phase, setPhase] = useState<"idle" | "in" | "out">("idle");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const pieces = useMemo(() => {
    return Array.from({ length: PIECE_COUNT }, (_, i) => {
      const angle = ((i / PIECE_COUNT) * 360 + (i % 7) * 9) * (Math.PI / 180);
      const distance = 90 + ((i * 23) % 160);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance * 0.55 + 40 + (i % 9) * 14;
      return {
        dx,
        dy,
        delay: (i % 14) * 20,
        duration: 1200 + ((i * 41) % 800),
        size: 5 + (i % 6),
        spin: (i * 53) % 360,
        color: COLORS[i % COLORS.length],
        round: i % 4 === 0,
      };
    });
  }, []);

  useEffect(() => {
    if (!active) {
      setPhase("idle");
      return;
    }

    setPhase("in");
    const leave = window.setTimeout(() => setPhase("out"), 2400);
    const done = window.setTimeout(() => onDoneRef.current(), 3000);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
    };
  }, [active]);

  if (!active && phase === "idle") return null;

  return (
    <div
      className={`${styles.layer} ${phase === "out" ? styles.leaving : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.confetti} aria-hidden>
        {pieces.map((piece, i) => (
          <span
            key={i}
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

      <div className={styles.toast}>
        <p className={styles.toastTitle}>Great work!</p>
        <p className={styles.toastSub}>Today counts as a win.</p>
      </div>
    </div>
  );
}
