import { HabitsPage } from "@/components/habits/habits-page";
import { requireUser } from "@/lib/auth";
import { listHabits } from "@/lib/daily/habits";

export default async function HabitsRoutePage() {
  const user = await requireUser();
  const [activeHabits, archivedHabits] = await Promise.all([
    listHabits(user.id, true),
    listHabits(user.id, false),
  ]);

  return (
    <HabitsPage
      activeHabits={activeHabits}
      archivedHabits={archivedHabits}
    />
  );
}
