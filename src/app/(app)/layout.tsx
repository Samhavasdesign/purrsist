import { AppNav } from "@/components/nav/app-nav";
import { AppTopBar } from "@/components/nav/app-top-bar";
import { requireUser } from "@/lib/auth";
import { countRescuedCats } from "@/lib/collection/rescue-toast";
import { getOrCreateTodayEntry } from "@/lib/daily/entry";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  // Ensure today's Daily Entry exists on any authenticated app open.
  await getOrCreateTodayEntry(user.id);
  const catCount = await countRescuedCats(user.id);

  return (
    <>
      <AppTopBar catCount={catCount} />
      {children}
      <AppNav />
    </>
  );
}
