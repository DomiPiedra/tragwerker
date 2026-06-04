"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";

import type { DashboardRecentBoard } from "@/lib/content-open-shared";
import { cn } from "@/lib/utils";

function formatOpenedAgo(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Opened just now";
  if (minutes < 60) {
    return `Opened ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Opened ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `Opened ${days} day${days === 1 ? "" : "s"} ago`;
  }
  return `Opened ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date)}`;
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
  allBoards: DashboardRecentBoard[];
  myBoards: DashboardRecentBoard[];
}) {
  const [filter, setFilter] = useState<"all" | "mine">("mine");
  const boards = filter === "all" ? allBoards : myBoards;

  return (
    <section className="w-full space-y-5">
      <div className="flex items-center gap-5 text-sm">
        <button
          type="button"
          onClick={() => setFilter("mine")}
          className={cn(
            "font-medium transition-colors",
            filter === "mine" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Recent
        </button>
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={cn(
            "font-medium transition-colors",
            filter === "all" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Team
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
            key={`${board.pathLabel}-${board.openedAt}`}
            href={board.href}
            className="flex min-h-[220px] flex-col overflow-hidden rounded-2xl bg-[#efefef] transition-colors hover:bg-[#e6e6e6]"
          >
            <div className="px-4 pt-4 pb-1">
              <p className="truncate text-[14px] font-semibold tracking-[-0.02em]">{board.title}</p>
              <p className="text-muted-foreground mt-0.5 truncate font-mono text-[12px] font-normal">
                {board.pathLabel}
              </p>
              <p className="text-muted-foreground mt-0.5 text-[13px] font-normal">
                {formatOpenedAgo(board.openedAt)}
              </p>
            </div>
            <BoardPreviewGrid cells={board.previewCells} />
          </Link>
        ))}
      </div>

      {boards.length === 0 ? (
        <p className="text-muted-foreground text-center text-sm">
          {filter === "mine"
            ? "No recently opened pages yet. Open a project, blog post, or other content to see it here."
            : "No one has opened content recently. Activity from edits is kept in the background only."}
        </p>
      ) : null}
    </section>
  );
}
