"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { isContentFullView } from "@/lib/content-full-view";
import { cn } from "@/lib/utils";

import { ContentOpenTracker } from "@/components/content-open-tracker";

import { DashboardSidebar, type DashboardUser } from "./dashboard-sidebar";

function DashboardShellInner({
  user,
  children,
}: {
  user: DashboardUser;
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const searchParams = useSearchParams();
  const isFullView = isContentFullView(searchParams);

  return (
    <div
      className={cn(
        "flex h-svh overflow-hidden",
        isFullView ? "bg-[#ececec] p-0" : "bg-[#e8e8e8] p-3 md:gap-4 md:p-4"
      )}
    >
      <ContentOpenTracker />
      {!isMobile && !isFullView ? (
        <DashboardSidebar
          user={user}
          className="sticky top-3 hidden h-[calc(100svh-1.5rem)] max-h-[calc(100svh-1.5rem)] w-[248px] shrink-0 self-start md:top-4 md:flex md:h-[calc(100svh-2rem)] md:max-h-[calc(100svh-2rem)]"
        />
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {isMobile && !isFullView ? (
          <div className="mb-3 flex shrink-0 items-center md:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="bg-white shadow-sm"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </Button>
          </div>
        ) : null}
        <main
          className={cn(
            "min-h-0 flex-1",
            isFullView ? "overflow-hidden" : "overflow-y-auto"
          )}
        >
          {children}
        </main>
      </div>

      {isMobile && !isFullView ? (
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetContent side="left" className="w-[min(280px,88vw)] border-0 bg-white p-0">
            <DashboardSidebar
              user={user}
              className="flex h-full w-full flex-col"
              onNavigate={() => setMobileNavOpen(false)}
            />
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}

export function DashboardShell({
  user,
  children,
}: {
  user: DashboardUser;
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex h-svh overflow-hidden bg-[#e8e8e8] p-3 md:p-4">
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      }
    >
      <DashboardShellInner user={user}>{children}</DashboardShellInner>
    </Suspense>
  );
}
