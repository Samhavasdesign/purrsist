import styles from "./how-it-works.module.css";

const SECTIONS = [
  {
    id: "basic-loop",
    title: "The basic loop",
    body: "Capture a thought with a quick significance tap and some text. AI sorts it in the background — type and where it belongs — and it shows up on today's dashboard or in Backlog. You don't organize in the moment; you just get it out of your head.",
  },
  {
    id: "significance",
    title: "Significance tap (Red / Yellow / Green)",
    body: "Red means a big deal, Yellow means it matters, Green means eventually — or you just don't want to forget it. This is about how important the item is, not when it's due. A future interview can still be Red; the date is a separate signal.",
  },
  {
    id: "today",
    title: "Today's structure",
    body: [
      "Must-Do — the one thing that makes today a win.",
      "Should-Dos — two next-priority items.",
      "Quick Wins — three short, sub-10-minute tasks.",
      "Habits — daily check-offs that stick around.",
      "Daily Reminder — a free-text note you rewrite each day (task, affirmation, or \"don't do X\").",
    ],
  },
  {
    id: "backlog",
    title: "Backlog",
    body: "Anything that isn't placed on today — including uncategorized captures and future-dated items — lives in Backlog. You can review, correct tags or significance, promote items onto a day, or check things off anytime. Capture stays fast; organizing happens later.",
  },
  {
    id: "scheduled",
    title: "Scheduled reminders",
    body: "If your capture includes date language (\"interview next Tuesday,\" \"renew passport on the 15th\"), AI extracts a target date instead of placing it immediately. Until then it sits under Upcoming in Backlog. On that date it tries to land on the dashboard and appears in that morning's digest.",
  },
  {
    id: "email",
    title: "Morning Digest and Weekly Recap",
    body: "Morning Digest closes yesterday and nudges you on today's empty slots — once, in the morning. Weekly Recap is a plain Sunday list of what got done that week. Email is the reliable channel: push can fail quietly, so nothing time-sensitive depends on it alone.",
  },
  {
    id: "habits",
    title: "Habits",
    body: "Add habits manually anytime, or accept a suggestion when you've captured the same thing repeatedly. Once added, they appear on Today as a checklist you tick off each day. Declining a suggestion means that item won't prompt again.",
  },
  {
    id: "cats",
    title: "Weekly Stray Cat Rescue",
    body: "Show up 6 or 7 days in a Mon–Sun week — any interaction counts, including just capturing — and you rescue a new stray. Five or fewer means no cat that week; nothing is lost or punished. Every rescued cat lives permanently in Collection.",
  },
] as const;

export default function HowPurrsistWorksPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>How Purrsist Works</h1>
        <p className={styles.subtitle}>
          A short reference for when something feels unclear. Skim what you
          need — nothing here is required reading.
        </p>
      </header>

      <div className={styles.sections}>
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            className={styles.section}
            aria-labelledby={section.id}
          >
            <h2 id={section.id} className={styles.sectionTitle}>
              {section.title}
            </h2>
            {Array.isArray(section.body) ? (
              <ul className={styles.list}>
                {section.body.map((line) => (
                  <li key={line} className={styles.listItem}>
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.body}>{section.body}</p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
