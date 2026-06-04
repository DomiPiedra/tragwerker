import { prisma } from "@/lib/prisma";
import { PropertiesListClient } from "./properties-list-client";

export default async function ImmobilienPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const propertyIdRaw = resolvedSearchParams.propertyId;
  const viewRaw = resolvedSearchParams.propertyView;
  const initialFullViewPropertyId = Array.isArray(propertyIdRaw) ? propertyIdRaw[0] : propertyIdRaw ?? null;
  const initialIsFullPropertyView = (Array.isArray(viewRaw) ? viewRaw[0] : viewRaw) === "full";

  const properties = await prisma.property.findMany({ orderBy: { updatedAt: "desc" } });
  const serialized = properties.map((property) => ({
    id: property.id,
    title: property.title,
    slug: property.slug,
    status: property.status,
    address: property.address,
    priceEur: property.priceEur,
    bedrooms: property.bedrooms,
    updatedAt: property.updatedAt.toISOString(),
    createdAt: property.createdAt.toISOString(),
  }));

  return (
    <PropertiesListClient
      initialProperties={serialized}
      initialFullViewPropertyId={initialFullViewPropertyId}
      initialIsFullPropertyView={initialIsFullPropertyView}
    />
  );
}
