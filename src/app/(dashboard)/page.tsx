import { activityEntityHref } from "@/lib/activity-log";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardBoardsGrid, type DashboardBoard } from "@/components/dashboard-boards-grid";
import { DashboardCreateInput } from "@/components/dashboard-create-input";

const ENTITY_LABELS: Record<string, string> = {
  project: "Project",
  portfolioItem: "Portfolio",
  blogPost: "Blog",
  teamMember: "Team",
  event: "Event",
  property: "Immobilien",
};

function clipPreview(text: string | null | undefined, max = 80): string {
  if (!text?.trim()) return "";
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function toBoard(entry: {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  title: string;
  details: string | null;
  createdAt: Date;
}): DashboardBoard {
  const entityLabel = ENTITY_LABELS[entry.entityType] ?? entry.entityType;
  return {
    id: entry.id,
    title: entry.title,
    href: activityEntityHref(entry.entityType, entry.entityId),
    updatedAt: entry.createdAt.toISOString(),
    action: entry.action,
    previewCells: [
      entry.title,
      clipPreview(entry.details) || `${entry.action} ${entityLabel.toLowerCase()}`,
      entityLabel,
      entry.action,
    ],
  };
}

const activitySelect = {
  id: true,
  entityType: true,
  entityId: true,
  action: true,
  title: true,
  details: true,
  createdAt: true,
  userId: true,
} as const;

export default async function DashboardPage() {
  const user = await requireUser();

  const recentActivity = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 48,
    select: activitySelect,
  });

  const globalActivity = recentActivity.slice(0, 24);
  const myActivity = recentActivity
    .filter((entry) => entry.userId === user.id)
    .slice(0, 24);

  const allBoards = globalActivity.map(toBoard);
  const myBoards = myActivity.map(toBoard);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8 md:px-8 md:py-12">
      <div className="flex flex-col items-center gap-8 pt-6 md:pt-10">
        <h1 className="text-center text-[2rem] font-semibold tracking-[-0.03em] text-foreground md:text-[2.5rem]">
          What do you want to create today?
        </h1>
        <DashboardCreateInput />
      </div>

      <DashboardBoardsGrid allBoards={allBoards} myBoards={myBoards} />
    </div>
  );
}
