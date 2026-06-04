"use client";

import Link from "next/link";
import { Briefcase, FileText, FolderOpen, type LucideIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type DashboardQuickActionRecent = {
  id: string;
  label: string;
  preview: string;
};

export type DashboardQuickActionModel = {
  key: "project" | "portfolioItem" | "blogPost";
  label: string;
  href: string;
  countLine: string;
  recent: DashboardQuickActionRecent[];
};

const SECTION_ICONS: Record<DashboardQuickActionModel["key"], LucideIcon> = {
  project: FolderOpen,
  portfolioItem: Briefcase,
  blogPost: FileText,
};

function recentItemHref(sectionKey: DashboardQuickActionModel["key"], id: string): string {
  switch (sectionKey) {
    case "project":
      return `/projects?projectId=${encodeURIComponent(id)}&projectView=full`;
    case "portfolioItem":
      return `/portfolio?itemId=${encodeURIComponent(id)}&portfolioView=full`;
    case "blogPost":
      return `/blog?postId=${encodeURIComponent(id)}&blogView=full`;
    default:
      return "";
  }
}

function QuickActionCard({ card }: { card: DashboardQuickActionModel }) {
  const Icon = SECTION_ICONS[card.key];

  return (
    <div
      className={cn(
        "bg-muted/40 hover:bg-muted flex gap-4 rounded-xl border p-4 transition-colors",
        "md:min-h-[7.5rem]"
      )}
    >
      <Link href={card.href} className="flex min-w-[38%] max-w-[45%] shrink-0 flex-col justify-between">
        <Icon className="text-muted-foreground mb-3 size-5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium">{card.label}</p>
          <p className="text-muted-foreground mt-1 text-xs">{card.countLine}</p>
        </div>
      </Link>

      <div className="border-border/70 flex min-w-0 flex-1 flex-col justify-center border-l pl-3">
        {card.recent.length === 0 ? (
          <p className="text-muted-foreground text-xs italic">No items yet</p>
        ) : (
          <ul className="space-y-1.5">
            {card.recent.map((item) => (
              <li key={item.id} className="min-w-0">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Link
                        href={recentItemHref(card.key, item.id)}
                        className="text-foreground/90 hover:text-foreground block truncate border-b border-transparent text-xs transition-colors hover:border-b-zinc-300 dark:hover:border-b-zinc-600"
                      >
                        {item.label}
                      </Link>
                    }
                  />
                  <TooltipContent side="top" align="end" className="max-w-[240px] text-left leading-snug">
                    {item.preview || item.label}
                  </TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function DashboardQuickActions({ cards }: { cards: DashboardQuickActionModel[] }) {
  return (
    <TooltipProvider delay={200}>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <QuickActionCard key={card.key} card={card} />
        ))}
      </div>
    </TooltipProvider>
  );
}
