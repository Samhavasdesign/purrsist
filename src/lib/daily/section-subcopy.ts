/**
 * Module-level subheadings under Today (and Backlog) section headers.
 * One fixed line per module — edit here, not in JSX.
 */
export const SECTION_SUBCOPY = {
  mustDo: "Hot tickets.",
  shouldDos: "Medium urgency.",
  quickWins: "Small stuff, done fast.",
  habitChecklist: "Same list every day — just check what you did.",
  dailyReminder: "Note to self.",
  backlog: "Everything you're not doing today, but don't want to lose.",
} as const;

/**
 * Backlog group headers — plural title plus one fixed line, matching the
 * title/subcopy pairing used by the Today modules. Keyed by BacklogSection.key.
 */
export const BACKLOG_GROUP_COPY: Record<
  string,
  { title: string; hint: string }
> = {
  upcoming: { title: "Upcoming", hint: "Already has a date." },
  task: { title: "Tasks", hint: "Saved for later" },
  errand: { title: "Errands", hint: "While you're out." },
  reminder: { title: "Reminders", hint: "Don't let these slip." },
  shopping: { title: "Shopping", hint: "Things to pick up." },
  uncategorized: { title: "Everything else", hint: "Not sorted yet." },
};
