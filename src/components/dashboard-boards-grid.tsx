"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardBoard = {
  id: string;
  title: string;
  href: string;
  updatedAt: string;
  action: string;
  previewCells: string[];
};

function formatActivityAgo(iso: string, action: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const verb =
    action === "created" ? "Created" : action === "deleted" ? "Deleted" : "Updated";

  if (minutes < 1) return `${verb} just now`;
  if (minutes < 60) {
    return `${verb} ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${verb} ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${verb} ${days} day${days === 1 ? "" : "s"} ago`;
  }
  return `${verb} ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date)}`;
}

function BoardPreviewGrid({ cells }: { cells: string[] }) {
  const items = [...cells, "", "", "", ""].slice(0, 4);

  return (
    <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-2 p-3 pt-2">
      {items.map((cell, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-lg bg-[#f3f3f3] p-2 text-[10px] leading-snug text-foreground/55"
        >
          <p className="line-clamp-4">{cell || "—"}</p>
        </div>
      ))}
    </div>
  );
}

export function DashboardBoardsGrid({
  allBoards,
  myBoards,
}: {
  allBoards: DashboardBoard[];
  myBoards: DashboardBoard[];
}) {
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const boards = filter === "all" ? allBoards : myBoards;

  return (
    <section className="w-full space-y-5">
      <div className="flex items-center gap-5 text-sm">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "font-medium transition-colors",
            filter === "all" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => setFilter("mine")}
          className={cn(
            "font-medium transition-colors",
            filter === "mine" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Mine
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/projects"
          className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl bg-[#efefef] text-foreground/50 transition-colors hover:bg-[#e6e6e6] hover:text-foreground/70"
        >
          <Plus className="size-10 stroke-[1.5]" />
        </Link>

        {boards.map((board) => (
          <Link
            key={board.id}
            href={board.href}
            className="flex min-h-[220px] flex-col overflow-hidden rounded-2xl bg-[#efefef] transition-colors hover:bg-[#e6e6e6]"
          >
            <div className="px-4 pt-4 pb-1">
              <p className="truncate text-[14px] font-semibold tracking-[-0.02em]">{board.title}</p>
              <p className="text-muted-foreground mt-0.5 text-[13px] font-normal">
                {formatActivityAgo(board.updatedAt, board.action)}
              </p>
            </div>
            <BoardPreviewGrid cells={board.previewCells} />
          </Link>
        ))}
      </div>

      {boards.length === 0 ? (
        <p className="text-muted-foreground text-center text-sm">
          {filter === "mine"
            ? "No activity from you yet. Create or edit content to see it here."
            : "No activity yet. Create or edit content to populate this feed."}
        </p>
      ) : null}
    </section>
  );
}
