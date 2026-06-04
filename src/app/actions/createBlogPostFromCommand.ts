"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity-log";
import { requireEditorOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CommandBarBlogPayload } from "@/types/command-intent";

function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 96) || "post";
}

export async function createBlogPostFromCommand(blog: CommandBarBlogPayload) {
  await requireEditorOrAdmin();

  const title = blog.title.trim() || "Untitled Post";
  const baseSlug = slugify(title);
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
      title,
      slug: candidate,
      excerpt: blog.excerpt?.trim() || null,
      content: blog.contentHtml || "<p></p>",
      published: false,
      publishedAt: null,
    },
  });

  await logActivity({
    entityType: "blogPost",
    entityId: post.id,
    action: "created",
    title: post.title,
    details: "Created from command bar",
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
