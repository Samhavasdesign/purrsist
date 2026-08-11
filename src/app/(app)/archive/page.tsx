import { redirect } from "next/navigation";

type SearchParams = Promise<{ date?: string | string[] }>;

/** Archive lives under Backlog → Archived. Keep this route as a deep-link. */
export default async function ArchivePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const raw = params.date;
  const date = Array.isArray(raw) ? raw[0] : raw;

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    redirect(`/backlog?tab=archived&date=${encodeURIComponent(date)}`);
  }

  redirect("/backlog?tab=archived");
}
