import { CollectionScreen } from "@/components/collection/collection-screen";

type SearchParams = Promise<{ cat?: string | string[] }>;

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const raw = params.cat;
  const highlightCatId = Array.isArray(raw) ? raw[0] : raw;

  return <CollectionScreen highlightCatId={highlightCatId ?? null} />;
}
