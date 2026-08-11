import { HabitsPage } from "@/components/habits/habits-page";
import { requireUser } from "@/lib/auth";
import { listHabits } from "@/lib/daily/habits";

type SearchParams = Promise<{ tab?: string | string[] }>;

export default async function HabitsRoutePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const raw = params.tab;
  const tabParam = Array.isArray(raw) ? raw[0] : raw;
  const tab = tabParam === "archived" ? "archived" : "active";

  const [activeHabits, archivedHabits] = await Promise.all([
    listHabits(user.id, true),
    listHabits(user.id, false),
  ]);

  return (
    <HabitsPage
      tab={tab}
      activeHabits={activeHabits}
      archivedHabits={archivedHabits}
    />
  );
}
