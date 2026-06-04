"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  Clock3,
  FileText,
  FolderOpen,
  ImageIcon,
  LayoutGrid,
  Search,
  Settings,
  Share2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SettingsModal } from "@/components/settings-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCommandBarStore } from "@/store/command-bar-store";
import { cn } from "@/lib/utils";

export type DashboardUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
};

type NavItem = {
  icon: LucideIcon;
  label: string;
  href: string;
  match?: (pathname: string) => boolean;
};

const mainNav: NavItem[] = [
  {
    icon: LayoutGrid,
    label: "Dashboard",
    href: "/",
    match: (p) => p === "/",
  },
  {
    icon: FolderOpen,
    label: "Projects",
    href: "/projects",
    match: (p) => p.startsWith("/projects"),
  },
  {
    icon: Briefcase,
    label: "Portfolio",
    href: "/portfolio",
    match: (p) => p.startsWith("/portfolio"),
  },
  {
    icon: Users,
    label: "Team",
    href: "/team",
    match: (p) => p.startsWith("/team"),
  },
  {
    icon: Calendar,
    label: "Events",
    href: "/events",
    match: (p) => p.startsWith("/events"),
  },
  {
    icon: FileText,
    label: "Blog",
    href: "/blog",
    match: (p) => p.startsWith("/blog"),
  },
  {
    icon: Building2,
    label: "Immobilien",
    href: "/immobilien",
    match: (p) => p.startsWith("/immobilien"),
  },
  {
    icon: ImageIcon,
    label: "Media",
    href: "/media",
    match: (p) => p.startsWith("/media"),
  },
  {
    icon: BarChart3,
    label: "Analytics",
    href: "/analytics",
    match: (p) => p.startsWith("/analytics"),
  },
];

function NavPill({
  icon: Icon,
  label,
  href,
  active,
  onNavigate,
}: NavItem & { active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-full px-3 py-2 text-[14px] font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-foreground/70 hover:bg-black/5 hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function UtilityButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[14px] text-foreground/80 transition-colors",
        disabled
          ? "cursor-not-allowed opacity-40"
          : "hover:bg-black/5 hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

export function DashboardSidebar({
  user,
  className,
  onNavigate,
}: {
  user: DashboardUser;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const openCommandBar = useCommandBarStore((state) => state.open);
  const resetCommandSession = useCommandBarStore((state) => state.resetSessionState);

  const initials =
    user.displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || user.username.slice(0, 2).toUpperCase();

  useEffect(() => {
    function onOpenSettings() {
      setSettingsOpen(true);
    }

    window.addEventListener("hcms:open-settings", onOpenSettings);
    return () => window.removeEventListener("hcms:open-settings", onOpenSettings);
  }, []);

  return (
    <>
      <aside
        className={cn(
          "flex flex-col rounded-[28px] bg-white px-3 py-4 shadow-sm",
          className
        )}
      >
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="mb-4 flex w-full items-center gap-2.5 rounded-xl px-1 py-1 text-left transition-colors hover:bg-black/5"
        >
          <Avatar size="lg" className="size-9">
            {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.displayName} /> : null}
            <AvatarFallback className="bg-[#e85d4a] text-sm font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{user.displayName}</span>
          <ChevronDown className="text-muted-foreground size-4 shrink-0" />
        </button>

        <div className="space-y-0.5">
          <UtilityButton
            icon={Search}
            label="Search"
            onClick={() => {
              resetCommandSession();
              openCommandBar();
              onNavigate?.();
            }}
          />
          <UtilityLink icon={Clock3} label="Recents" href="/" onNavigate={onNavigate} />
          <UtilityLink icon={Share2} label="Shared With You" href="/portfolio" onNavigate={onNavigate} disabled />
          <UtilityButton icon={Bell} label="Notifications" disabled />
        </div>

        <div className="my-4 h-px bg-black/8" />

        <nav className="flex flex-1 flex-col gap-0.5">
          {mainNav.map((item) => (
            <NavPill
              key={item.href}
              {...item}
              active={item.match ? item.match(pathname) : pathname === item.href}
              onNavigate={onNavigate}
            />
          ))}
        </nav>

        <div className="mt-4 space-y-2">
          <UtilityButton
            icon={Settings}
            label="Settings"
            onClick={() => {
              setSettingsOpen(true);
              onNavigate?.();
            }}
          />
          <div className="rounded-full bg-[#f0f0f0] px-3 py-2">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-foreground/60">
              <span>Workspace usage</span>
              <span>Healthy</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-black/8">
              <div className="h-full w-[64%] rounded-full bg-foreground/80" />
            </div>
          </div>
        </div>
      </aside>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}

function UtilityLink({
  icon: Icon,
  label,
  href,
  onNavigate,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  href: string;
  onNavigate?: () => void;
  disabled?: boolean;
}) {
  if (disabled) {
    return <UtilityButton icon={Icon} label={label} disabled />;
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-[14px] text-foreground/80 transition-colors hover:bg-black/5 hover:text-foreground"
    >
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
