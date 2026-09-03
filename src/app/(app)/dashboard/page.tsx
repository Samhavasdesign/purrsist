import { cookies } from "next/headers";
import { TrialBanner } from "@/components/auth/trial-banner";
import { TRIAL_BANNER_DISMISSED_COOKIE } from "@/components/auth/trial-banner.constants";
import { DailyDashboard } from "@/components/daily/daily-dashboard";
import { listDueReminders } from "@/lib/backlog/due-reminders";
import { isAnonymousUser, requireUser } from "@/lib/auth";
import { prepareRescueToast } from "@/lib/collection/rescue-toast";
import { getOrCreateTodayEntry } from "@/lib/daily/entry";
import { listHabitsForDate } from "@/lib/daily/habits";
import { parseSectionHintFlags } from "@/lib/daily/section-hints";
import { createClient } from "@/lib/supabase/server";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const user = await requireUser();
  const anonymous = isAnonymousUser(user);
  const entry = await getOrCreateTodayEntry(user.id);
  const [habits, rescueToast] = await Promise.all([
    listHabitsForDate(user.id, entry.date),
    prepareRescueToast(user.id, entry.date),
  ]);

  const supabase = await createClient();
  const [{ data: profile }, dueReminders] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "has_filled_must_do_once, has_filled_should_dos_once, has_filled_quick_wins_once",
      )
      .eq("id", user.id)
      .maybeSingle(),
    listDueReminders(supabase, user.id),
  ]);

  const sectionHints = parseSectionHintFlags(profile);

  const trialBannerDismissed =
    (await cookies()).get(TRIAL_BANNER_DISMISSED_COOKIE)?.value === "1";

  return (
    <main className={styles.page}>
      {anonymous && !trialBannerDismissed ? <TrialBanner /> : null}
      <DailyDashboard
        entry={entry}
        habits={habits}
        sectionHints={sectionHints}
        dueReminders={dueReminders}
        rescueToast={rescueToast}
      />
    </main>
  );
}
