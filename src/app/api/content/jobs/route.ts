import { NextResponse } from "next/server";

import { UserRole } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth";
import { buildJobWhere, parseJobListFilters } from "@/lib/jobs/query";
import { toPublicJob } from "@/lib/jobs/public";
import { serializeJob } from "@/lib/jobs/serialize";
import { prisma } from "@/lib/prisma";
import { scheduleContentSeoGeneration } from "@/lib/seo/server";

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 96) || "job";
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const { searchParams } = new URL(request.url);
  const filters = parseJobListFilters(searchParams);

  if (!user) {
    filters.publishedOnly = true;
  }

  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "20", 10) || 20)
  );
  const sort = searchParams.get("sort") ?? "updatedAt";
  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  const allowedSort = new Set([
    "title",
    "department",
    "location",
    "employmentType",
    "updatedAt",
    "publishedAt",
    "createdAt",
  ]);
  const orderBy = {
    [allowedSort.has(sort) ? sort : "updatedAt"]: order,
  } as Record<string, "asc" | "desc">;

  const where = buildJobWhere(filters);

  const [rows, total] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.job.count({ where }),
  ]);

  const jobs = await Promise.all(
    rows.map((job) => toPublicJob(job, Boolean(user)))
  );

  return NextResponse.json({
    jobs,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  });
}

function canEditContent(role: string | undefined): boolean {
  return role === UserRole.admin || role === UserRole.editor;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = String(body.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const slugRaw = String(body.slug ?? "").trim();
  const baseSlug = slugRaw ? slugify(slugRaw) : slugify(title);
  let candidate = baseSlug;
  for (let n = 0; n < 100; n++) {
    const existing = await prisma.job.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) break;
    candidate = `${baseSlug}-${n + 2}`;
  }

  const job = await prisma.job.create({
    data: {
      title,
      slug: candidate,
      position: body.position ? String(body.position) : null,
      department: body.department ? String(body.department) : null,
      location: body.location ? String(body.location) : null,
      shortDescription: body.shortDescription ? String(body.shortDescription) : null,
      content: body.content ? String(body.content) : null,
      published: body.published === true,
      publishedAt: body.published === true ? new Date() : null,
      authorId: user.id,
    },
  });

  scheduleContentSeoGeneration("job", job.id);

  return NextResponse.json({ job: serializeJob(job) }, { status: 201 });
}
