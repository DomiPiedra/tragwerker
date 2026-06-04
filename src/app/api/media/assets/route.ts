import { NextResponse } from "next/server";

import { requireEditorOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_ITEMS = 120;

/** List media assets for pickers (authenticated editors). ?scope=all returns every type. */
export async function GET(request: Request) {
  await requireEditorOrAdmin();

  const scope = new URL(request.url).searchParams.get("scope") ?? "images";

  const rows = await prisma.mediaAsset.findMany({
    orderBy: { updatedAt: "desc" },
    take: MAX_ITEMS,
    select: {
      id: true,
      url: true,
      title: true,
      altText: true,
      mimeType: true,
      originalName: true,
      sizeBytes: true,
    },
  });

  const items =
    scope === "all"
      ? rows
      : rows.filter((row) => {
          const mime = row.mimeType.toLowerCase();
          if (mime.startsWith("image/")) return true;
          return /\.(png|jpe?g|webp|gif|svg|avif|bmp|ico)$/i.test(row.originalName);
        });

  return NextResponse.json({ items });
}
