"use client";

import { createContext, useContext } from "react";
import type { DailyItemKind } from "@/lib/daily/extra-items";

type SectionPulseContextValue = {
  /** Brief pop on a Today category when capture lands there. */
  pulseSection: (kind: DailyItemKind) => void;
};

export const SectionPulseContext =
  createContext<SectionPulseContextValue | null>(null);

export function useSectionPulse() {
  return useContext(SectionPulseContext);
}
