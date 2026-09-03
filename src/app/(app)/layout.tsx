import { AppNav } from "@/components/nav/app-nav";
import { AppTopBar } from "@/components/nav/app-top-bar";
import { isAnonymousUser, requireUser } from "@/lib/auth";
import { countRescuedCats } from "@/lib/collection/rescue-toast";
import { getOrCreateTodayEntry } from "@/lib/daily/entry";

function resolveDisplayName(
  metadata: Record<string, unknown> | undefined,
  email: string | null,
  anonymous: boolean,
): string {
  const fromMetadata = metadata?.full_name ?? metadata?.name;
  if (typeof fromMetadata === "string" && fromMetadata.trim()) {
    return fromMetadata.trim();
  }
  const local = email?.split("@")[0];
  if (local) return local;
  return anonymous ? "Guest" : "Account";
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  // Ensure today's Daily Entry exists on any authenticated app open.
  await getOrCreateTodayEntry(user.id);
  const catCount = await countRescuedCats(user.id);

  const guest = isAnonymousUser(user);
  const email = user.email ?? null;
  const displayName = resolveDisplayName(user.user_metadata, email, guest);

  return (
    <>
      <AppTopBar
        catCount={catCount}
        isGuest={guest}
        displayName={displayName}
        email={email}
      />
      {children}
      <AppNav />
    </>
  );
}
