import { prisma } from "@/lib/prisma";
import { TeamListClient } from "./team-list-client";

export default async function TeamPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const memberIdRaw = resolvedSearchParams.memberId;
  const viewRaw = resolvedSearchParams.teamView;
  const initialFullViewMemberId = Array.isArray(memberIdRaw) ? memberIdRaw[0] : memberIdRaw ?? null;
  const initialIsFullTeamView = (Array.isArray(viewRaw) ? viewRaw[0] : viewRaw) === "full";

  const members = await prisma.teamMember.findMany({ orderBy: { updatedAt: "desc" } });
  const serialized = members.map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    bio: member.bio,
    avatarUrl: member.avatarUrl,
    published: member.published,
    publishedAt: member.publishedAt ? member.publishedAt.toISOString() : null,
    updatedAt: member.updatedAt.toISOString(),
    createdAt: member.createdAt.toISOString(),
  }));

  return (
    <TeamListClient
      initialMembers={serialized}
      initialFullViewMemberId={initialFullViewMemberId}
      initialIsFullTeamView={initialIsFullTeamView}
    />
  );
}
