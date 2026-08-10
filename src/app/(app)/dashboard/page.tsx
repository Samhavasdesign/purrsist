import { QuickAdd } from "@/components/capture/quick-add";
import { TrialBanner } from "@/components/auth/trial-banner";
import { DailyDashboard } from "@/components/daily/daily-dashboard";
import { isAnonymousUser, requireUser } from "@/lib/auth";
import { getOrCreateTodayEntry } from "@/lib/daily/entry";
import { listHabitsForDate } from "@/lib/daily/habits";
import {
  DEFAULT_SECTION_HINT_FLAGS,
  parseSectionHintFlags,
} from "@/lib/daily/section-hints";
import { createClient } from "@/lib/supabase/server";
import {
  DAILY_SLOTS,
  slotTextColumn,
} from "@/lib/types/database";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const user = await requireUser();
  const anonymous = isAnonymousUser(user);
  const entry = await getOrCreateTodayEntry(user.id);
  const habits = await listHabitsForDate(user.id, entry.date);

  const supabase = await createClient();
  const [{ count: captureCount }, profileResult] = await Promise.all([
    supabase
      .from("backlog_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("profiles")
      .select(
        "has_filled_must_do_once, has_filled_should_dos_once, has_filled_quick_wins_once",
      )
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const sectionHints = profileResult.error
    ? DEFAULT_SECTION_HINT_FLAGS
    : parseSectionHintFlags(profileResult.data);

  const hasCaptures = (captureCount ?? 0) > 0;
  const hasFilledSlot = DAILY_SLOTS.some((s) =>
    Boolean(entry[slotTextColumn(s.slot)]?.toString().trim()),
  );
  const isFreshStart = !hasCaptures && !hasFilledSlot;

  return (
    <main className={styles.page}>
      {anonymous ? <TrialBanner /> : null}
      <DailyDashboard
        entry={entry}
        habits={habits}
        sectionHints={sectionHints}
      >
        <section className={styles.capture} id="capture">
          <p className={styles.subtitle}>
            {isFreshStart
              ? "Tap Must-Do, Should-Do, or Quick Win, type, and submit."
              : "Tap where it belongs today — Must-Do, Should-Do, or Quick Win."}
          </p>
          <QuickAdd autoFocus={isFreshStart} />
        </section>
      </DailyDashboard>
    </main>
  );
}
