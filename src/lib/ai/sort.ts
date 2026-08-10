import Anthropic from "@anthropic-ai/sdk";
import {
  categoryLabelForSignificance,
  defaultSlotsForSignificance,
} from "@/lib/capture/placement";
import type {
  BacklogTag,
  DailySlot,
  Significance,
} from "@/lib/types/database";
import { DAILY_SLOTS } from "@/lib/types/database";

export type SortResult = {
  tag: BacklogTag;
  placement: DailySlot | null;
  target_date: string | null;
  reason: string;
  usedAi: boolean;
};

const TAGS: BacklogTag[] = [
  "task",
  "errand",
  "reminder",
  "shopping",
  "uncategorized",
];

function isSlot(value: unknown): value is DailySlot {
  return DAILY_SLOTS.some(({ slot }) => slot === value);
}

function isTag(value: unknown): value is BacklogTag {
  return TAGS.includes(value as BacklogTag);
}

function todayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Fallback when Anthropic is missing or fails — never blocks capture. */
export function fallbackSort(input?: {
  significance: Significance;
  openSlots: DailySlot[];
  forceBacklog?: boolean;
}): SortResult {
  if (input?.forceBacklog) {
    return {
      tag: "uncategorized",
      placement: null,
      target_date: null,
      reason: "Saved to Backlog",
      usedAi: false,
    };
  }

  const preferred = input
    ? defaultSlotsForSignificance(input.significance).find((slot) =>
        input.openSlots.includes(slot),
      ) ?? null
    : null;

  return {
    tag: "uncategorized",
    placement: preferred,
    target_date: null,
    reason: preferred
      ? `Added to today's ${categoryLabelForSignificance(input!.significance)}`
      : "Saved to Backlog",
    usedAi: false,
  };
}

export async function sortCapture(input: {
  text: string;
  significance: Significance;
  openSlots: DailySlot[];
  forceBacklog?: boolean;
}): Promise<SortResult> {
  if (input.forceBacklog) {
    return fallbackSort(input);
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fallbackSort(input);

  const today = todayKey();
  const client = new Anthropic({ apiKey });
  const category = categoryLabelForSignificance(input.significance);
  const preferredSlots = defaultSlotsForSignificance(input.significance);

  try {
    const response = await client.messages.create({
      model: "claude-3-5-haiku-latest",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You sort one captured note for a personal productivity app.

Today's date: ${today}
Item text: ${JSON.stringify(input.text)}
Significance tap maps to today's category:
  red = Big deal → Must-Do
  yellow = Matters → Should-Do
  green = Eventually → Quick Win
This item's significance: ${input.significance} → ${category}
Preferred slots for this item (in order): ${JSON.stringify(preferredSlots)}
Open preferred slots right now: ${JSON.stringify(input.openSlots)}

Return ONLY compact JSON with keys:
- tag: "task" | "errand" | "reminder" | "shopping"
- placement: one of the open preferred slots, or null only if it should stay in Backlog
- target_date: "YYYY-MM-DD" if the text has a clear future date (after today), else null
- reason: short phrase for the user, e.g. "Sorted as Errand → today's Should-Do"

Rules:
- Default: place onto today in the significance-mapped category using an open preferred slot.
- If target_date is set and is after today, placement MUST be null (Upcoming / Backlog).
- If open preferred slots is empty, placement MUST be null (caller may add an overflow row).
- Never invent a slot that is not in open preferred slots.
- Only use null placement without a future date when the text is clearly not for today.`,
        },
      ],
    });

    const block = response.content.find((part) => part.type === "text");
    if (!block || block.type !== "text") return fallbackSort(input);

    const match = block.text.match(/\{[\s\S]*\}/);
    if (!match) return fallbackSort(input);

    const parsed = JSON.parse(match[0]) as {
      tag?: unknown;
      placement?: unknown;
      target_date?: unknown;
      reason?: unknown;
    };

    let tag: BacklogTag = isTag(parsed.tag) ? parsed.tag : "uncategorized";
    if (tag === "uncategorized") tag = "task";

    let target_date: string | null =
      typeof parsed.target_date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(parsed.target_date)
        ? parsed.target_date
        : null;

    if (target_date && target_date <= today) {
      target_date = null;
    }

    let placement: DailySlot | null =
      isSlot(parsed.placement) && input.openSlots.includes(parsed.placement)
        ? parsed.placement
        : null;

    // Default to first open preferred slot when AI omits placement and it's for today.
    if (!placement && !target_date && input.openSlots.length > 0) {
      placement = input.openSlots[0] ?? null;
    }

    if (target_date) placement = null;

    const reason =
      typeof parsed.reason === "string" && parsed.reason.trim()
        ? parsed.reason.trim()
        : placement
          ? `Sorted as ${tag} → today's ${category}`
          : target_date
            ? `Sorted as ${tag} → Upcoming`
            : `Sorted as ${tag} → Backlog`;

    return { tag, placement, target_date, reason, usedAi: true };
  } catch {
    return fallbackSort(input);
  }
}
