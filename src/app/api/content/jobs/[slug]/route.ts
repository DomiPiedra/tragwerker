import { NextResponse } from "next/server";

import { UserRole } from "@/generated/prisma/enums";
import { getCurrentUser } from "@/lib/auth";
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

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const user = await getCurrentUser();

  const job = await prisma.job.findUnique({ where: { slug } });
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  if (!user && !job.published) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  try {
    const publicJob = await toPublicJob(job, Boolean(user));
    return NextResponse.json({ job: publicJob });
  } catch {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
}

function canEditContent(role: string | undefined): boolean {
  return role === UserRole.admin || role === UserRole.editor;
}

export async function PUT(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const existing = await prisma.job.findUnique({ where: { slug } });
  if (!existing) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nextSlugRaw = body.slug ? String(body.slug).trim() : existing.slug;
  const nextSlug = slugify(nextSlugRaw);
  if (nextSlug !== existing.slug) {
    const conflict = await prisma.job.findFirst({
      where: { slug: nextSlug, NOT: { id: existing.id } },
      select: { id: true },
    });
    if (conflict) {
      return NextResponse.json({ error: "Slug already exists." }, { status: 409 });
    }
  }

  const published =
    body.published !== undefined ? body.published === true : existing.published;

  const job = await prisma.job.update({
    where: { id: existing.id },
    data: {
      title: body.title !== undefined ? String(body.title) : existing.title,
      slug: nextSlug,
      position: body.position !== undefined ? String(body.position) || null : existing.position,
      department:
        body.department !== undefined ? String(body.department) || null : existing.department,
      location: body.location !== undefined ? String(body.location) || null : existing.location,
      shortDescription:
        body.shortDescription !== undefined
          ? String(body.shortDescription) || null
          : existing.shortDescription,
      content: body.content !== undefined ? String(body.content) || null : existing.content,
      requirements:
        body.requirements !== undefined
          ? String(body.requirements) || null
          : existing.requirements,
      benefits: body.benefits !== undefined ? String(body.benefits) || null : existing.benefits,
      responsibilities:
        body.responsibilities !== undefined
          ? String(body.responsibilities) || null
          : existing.responsibilities,
      featured: body.featured !== undefined ? body.featured === true : existing.featured,
      published,
      publishedAt: published ? existing.publishedAt ?? new Date() : null,
    },
  });

  scheduleContentSeoGeneration("job", job.id);

  return NextResponse.json({ job: serializeJob(job) });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user || !canEditContent(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;
  const existing = await prisma.job.findUnique({ where: { slug }, select: { id: true } });
  if (!existing) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  await prisma.job.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
