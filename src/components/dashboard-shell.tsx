"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

import { DashboardSidebar, type DashboardUser } from "./dashboard-sidebar";

export function DashboardShell({
  user,
  children,
}: {
  user: DashboardUser;
  children: React.ReactNode;
}) {
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-svh bg-[#e8e8e8] p-3 md:gap-4 md:p-4">
      {!isMobile ? (
        <DashboardSidebar user={user} className="hidden w-[248px] shrink-0 md:flex" />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {isMobile ? (
          <div className="mb-3 flex items-center md:hidden">
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
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>

      {isMobile ? (
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
