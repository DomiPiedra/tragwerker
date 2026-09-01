import { ProjectStatus } from "@/generated/prisma/enums";
import { normalizePortfolioDetails } from "@/lib/portfolio/details";
import { prisma } from "@/lib/prisma";
import { PortfolioListClient } from "./portfolio-list-client";

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const itemIdRaw = resolvedSearchParams.itemId;
  const viewRaw = resolvedSearchParams.portfolioView;
  const initialFullViewItemId = Array.isArray(itemIdRaw) ? itemIdRaw[0] : itemIdRaw ?? null;
  const initialIsFullPortfolioView =
    (Array.isArray(viewRaw) ? viewRaw[0] : viewRaw) === "full";

  const items = await prisma.portfolioItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });
  const serialized = items.map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    status: item.status ?? ProjectStatus.Draft,
    summary: item.summary,
    content: item.content,
    websiteUrl: item.websiteUrl,
    heroImageUrl: item.heroImageUrl,
    galleryUrls: item.galleryUrls ?? [],
    sortOrder: item.sortOrder ?? 0,
    details: normalizePortfolioDetails(item.details),
    updatedAt: item.updatedAt.toISOString(),
    createdAt: item.createdAt.toISOString(),
  }));

  return (
    <PortfolioListClient
      initialItems={serialized}
      initialFullViewItemId={initialFullViewItemId}
      initialIsFullPortfolioView={initialIsFullPortfolioView}
    />
  );
}
