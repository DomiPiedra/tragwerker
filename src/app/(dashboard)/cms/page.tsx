import { requireUser } from "@/lib/auth";
import { getDashboardRecentBoards } from "@/lib/content-open";
import { DashboardBoardsGrid } from "@/components/dashboard-boards-grid";
import { DashboardCreateInput } from "@/components/dashboard-create-input";

export default async function CmsDashboardPage() {
  const user = await requireUser();

  const [allBoards, myBoards] = await Promise.all([
    getDashboardRecentBoards("all", user.id),
    getDashboardRecentBoards("mine", user.id),
  ]);

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
