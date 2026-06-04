"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity-log";
import { requireEditorOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 96) || "post";
}

export async function createBlogPostQuick() {
  await requireEditorOrAdmin();
  const baseTitle = "Untitled Post";
  const baseSlug = slugify(baseTitle);
  let candidate = baseSlug;

  for (let n = 0; n < 100; n++) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing) break;
    candidate = `${baseSlug}-${n + 2}`;
  }

  const post = await prisma.blogPost.create({
    data: {
      title: baseTitle,
      slug: candidate,
      excerpt: null,
      content: null,
      published: false,
      publishedAt: null,
    },
  });

  await logActivity({
    entityType: "blogPost",
    entityId: post.id,
    action: "created",
    title: post.title,
    details: "Quick-created from blog list",
  });

  revalidatePath("/");
  revalidatePath("/blog");

  return {
    ok: true as const,
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      published: post.published,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      updatedAt: post.updatedAt.toISOString(),
      createdAt: post.createdAt.toISOString(),
    },
  };
}

export async function updateBlogPost(formData: FormData) {
  await requireEditorOrAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const title = formData.get("title")?.toString().trim() ?? "";
  const slugRaw = formData.get("slug")?.toString().trim() ?? "";
  const excerptRaw = formData.get("excerpt")?.toString().trim();
  const contentRaw = formData.get("content")?.toString().trim();
  const publishedRaw = formData.get("published")?.toString() ?? "false";
  const publishedAtRaw = formData.get("publishedAt")?.toString() ?? "";

  if (!id) return { ok: false as const, error: "Missing post id." };
  if (!title) return { ok: false as const, error: "Title is required." };

  const current = await prisma.blogPost.findUnique({
    where: { id },
    select: { slug: true },
  });
  if (!current) return { ok: false as const, error: "Post not found." };

  const slug = slugRaw ? slugify(slugRaw) : current.slug;
  if (slug !== current.slug) {
    const existing = await prisma.blogPost.findFirst({
      where: { slug, NOT: { id } },
      select: { id: true },
    });
    if (existing) return { ok: false as const, error: "Slug already exists." };
  }

  const published = publishedRaw === "true";
  let publishedAt: Date | null = null;
  if (publishedAtRaw.trim().length > 0) {
    const parsed = new Date(publishedAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false as const, error: "Invalid published date." };
    }
    publishedAt = parsed;
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title,
      slug,
      excerpt: excerptRaw ? excerptRaw : null,
      content: contentRaw ? contentRaw : null,
      published,
      publishedAt: published ? publishedAt ?? new Date() : null,
    },
  });

  await logActivity({
    entityType: "blogPost",
    entityId: post.id,
    action: "updated",
    title: post.title,
    details: "Updated from blog editor",
  });

  revalidatePath("/");
  revalidatePath("/blog");

  return {
    ok: true as const,
    post: {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      published: post.published,
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
      updatedAt: post.updatedAt.toISOString(),
      createdAt: post.createdAt.toISOString(),
    },
  };
}

export async function deleteBlogPost(id: string) {
  await requireEditorOrAdmin();
  if (!id) return { ok: false as const, error: "Missing post id." };

  const existing = await prisma.blogPost.findUnique({
    where: { id },
    select: { title: true },
  });

  await prisma.blogPost.delete({ where: { id } });

  await logActivity({
    entityType: "blogPost",
    entityId: id,
    action: "deleted",
    title: existing?.title ?? "Deleted post",
    details: "Removed from blog list",
  });

  revalidatePath("/");
  revalidatePath("/blog");
  return { ok: true as const };
}

