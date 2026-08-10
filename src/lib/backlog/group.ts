import type { BacklogItem, BacklogTag } from "@/lib/types/database";
import { BACKLOG_TAGS } from "@/lib/types/database";

export type RecencyGroup = "today" | "this_week" | "older";

export type BacklogSection = {
  key: string;
  title: string;
  items: BacklogItem[];
  /** Tag for category sections; null for Upcoming. */
  tag: BacklogTag | null;
};

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeekMonday(date: Date): Date {
  const day = startOfLocalDay(date);
  const weekday = day.getDay(); // 0 Sun … 6 Sat
  const offset = weekday === 0 ? 6 : weekday - 1;
  day.setDate(day.getDate() - offset);
  return day;
}

function toDateKey(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const d = typeof value === "string" ? new Date(value) : value;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function classifyRecency(
  createdAt: string,
  now = new Date(),
): RecencyGroup {
  const created = startOfLocalDay(new Date(createdAt));
  const today = startOfLocalDay(now);
  if (created.getTime() === today.getTime()) return "today";

  const weekStart = startOfWeekMonday(now);
  if (created >= weekStart && created < today) return "this_week";

  return "older";
}

function sortNewestFirst(items: BacklogItem[]): BacklogItem[] {
  return [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

/**
 * Split active backlog items into sections:
 * Upcoming (has target_date ≥ today), then one section per tag that has items.
 * Empty categories stay hidden until a card of that type is added.
 */
export function groupBacklogItems(
  items: BacklogItem[],
  now = new Date(),
): BacklogSection[] {
  const todayKey = toDateKey(now);
  const upcoming: BacklogItem[] = [];
  const byTag = Object.fromEntries(
    BACKLOG_TAGS.map(({ tag }) => [tag, [] as BacklogItem[]]),
  ) as Record<BacklogTag, BacklogItem[]>;

  for (const item of sortNewestFirst(items)) {
    if (item.target_date && item.target_date >= todayKey) {
      upcoming.push(item);
      continue;
    }

    const tag = byTag[item.tag] ? item.tag : "uncategorized";
    byTag[tag].push(item);
  }

  upcoming.sort((a, b) =>
    (a.target_date ?? "").localeCompare(b.target_date ?? ""),
  );

  const sections: BacklogSection[] = [];

  if (upcoming.length > 0) {
    sections.push({
      key: "upcoming",
      title: "Upcoming",
      items: upcoming,
      tag: null,
    });
  }

  for (const { tag, label } of BACKLOG_TAGS) {
    const tagged = byTag[tag];
    if (tagged.length === 0) continue;
    sections.push({
      key: tag,
      title: label,
      items: tagged,
      tag,
    });
  }

  return sections;
}

export function formatTargetDate(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
