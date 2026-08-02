"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity-log";
import { requireEditorOrAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scheduleContentSeoGeneration } from "@/lib/seo/server";

export async function createTeamMemberQuick() {
  await requireEditorOrAdmin();
  const member = await prisma.teamMember.create({
    data: {
      name: "Untitled Member",
      role: "Editor",
      bio: null,
      avatarUrl: null,
      published: false,
      publishedAt: null,
    },
  });

  await logActivity({
    entityType: "teamMember",
    entityId: member.id,
    action: "created",
    title: member.name,
    details: "Quick-created from team list",
  });

  revalidatePath("/");
  revalidatePath("/menschen");
  revalidatePath("/team");

  scheduleContentSeoGeneration("teamMember", member.id);

  return {
    ok: true as const,
    member: {
      id: member.id,
      name: member.name,
      role: member.role,
      bio: member.bio,
      avatarUrl: member.avatarUrl,
      published: member.published,
      publishedAt: member.publishedAt ? member.publishedAt.toISOString() : null,
      updatedAt: member.updatedAt.toISOString(),
      createdAt: member.createdAt.toISOString(),
    },
  };
}

export async function updateTeamMember(formData: FormData) {
  await requireEditorOrAdmin();
  const id = formData.get("id")?.toString() ?? "";
  const name = formData.get("name")?.toString().trim() ?? "";
  const roleRaw = formData.get("role")?.toString().trim() ?? "";
  const bioRaw = formData.get("bio")?.toString().trim();
  const avatarUrlRaw = formData.get("avatarUrl")?.toString().trim();
  const publishedRaw = formData.get("published")?.toString() ?? "false";
  const publishedAtRaw = formData.get("publishedAt")?.toString() ?? "";

  if (!id) return { ok: false as const, error: "Missing member id." };
  if (!name) return { ok: false as const, error: "Name is required." };

  const published = publishedRaw === "true";
  let publishedAt: Date | null = null;
  if (publishedAtRaw.trim().length > 0) {
    const parsed = new Date(publishedAtRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false as const, error: "Invalid published date." };
    }
    publishedAt = parsed;
  }

  const member = await prisma.teamMember.update({
    where: { id },
    data: {
      name,
      role: roleRaw || "Editor",
      bio: bioRaw ? bioRaw : null,
      avatarUrl: avatarUrlRaw ? avatarUrlRaw : null,
      published,
      publishedAt: published ? publishedAt ?? new Date() : null,
    },
  });

  await logActivity({
    entityType: "teamMember",
    entityId: member.id,
    action: "updated",
    title: member.name,
    details: "Updated from team editor",
  });

  revalidatePath("/");
  revalidatePath("/menschen");
  revalidatePath("/team");

  scheduleContentSeoGeneration("teamMember", member.id);

  return {
    ok: true as const,
    member: {
      id: member.id,
      name: member.name,
      role: member.role,
      bio: member.bio,
      avatarUrl: member.avatarUrl,
      published: member.published,
      publishedAt: member.publishedAt ? member.publishedAt.toISOString() : null,
      updatedAt: member.updatedAt.toISOString(),
      createdAt: member.createdAt.toISOString(),
    },
  };
}

export async function deleteTeamMember(id: string) {
  await requireEditorOrAdmin();
  if (!id) return { ok: false as const, error: "Missing member id." };

  const existing = await prisma.teamMember.findUnique({
    where: { id },
    select: { name: true },
  });

  await prisma.teamMember.delete({ where: { id } });

  await logActivity({
    entityType: "teamMember",
    entityId: id,
    action: "deleted",
    title: existing?.name ?? "Deleted team member",
    details: "Removed from team list",
  });

  revalidatePath("/");
  revalidatePath("/menschen");
  revalidatePath("/team");
  return { ok: true as const };
}

