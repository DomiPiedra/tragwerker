"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  ClipboardList,
  ChevronDown,
  Clock3,
  FileText,
  FolderOpen,
  ImageIcon,
  LayoutGrid,
  LogOut,
  Search,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { settingsMenuItems, type SettingsSection } from "@/components/settings-view";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCommandShortcutKeys } from "@/hooks/use-command-shortcut";
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

const overviewNav: NavItem[] = [
  {
    icon: LayoutGrid,
    label: "Dashboard",
    href: "/cms",
    match: (p) => p === "/cms",
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

const contentNav: NavItem[] = [
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
    icon: ClipboardList,
    label: "Jobs",
    href: "/cms/jobs",
    match: (p) => p.startsWith("/cms/jobs"),
  },
  {
    icon: Building2,
    label: "Immobilien",
    href: "/immobilien",
    match: (p) => p.startsWith("/immobilien"),
  },
];

function SidebarDivider() {
  return <div className="my-3 h-px bg-black/8" />;
}

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

function NavSection({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => (
        <NavPill
          key={item.href}
          {...item}
          active={item.match ? item.match(pathname) : pathname === item.href}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

function SidebarShortcutHint({ keys }: { keys: string[] }) {
  return (
    <span
      className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-md border border-black/10 bg-[#f3f3f3] px-1.5 py-0.5 text-[11px] leading-none font-medium text-foreground/55 opacity-60"
      aria-hidden
    >
      {keys.map((key) => (
        <span key={key}>{key}</span>
      ))}
    </span>
  );
}

function UtilityButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  shortcutKeys,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  shortcutKeys?: string[];
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
      <span className="min-w-0 flex-1">{label}</span>
      {shortcutKeys ? <SidebarShortcutHint keys={shortcutKeys} /> : null}
    </button>
  );
}

function UserMenuButton({
  user,
  initials,
  onOpenSection,
  onSignOut,
}: {
  user: DashboardUser;
  initials: string;
  onOpenSection: (section: SettingsSection) => void;
  onSignOut: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="mb-4 flex w-full items-center gap-2.5 rounded-xl px-1 py-1 text-left transition-colors hover:bg-black/5 data-popup-open:bg-black/5"
          />
        }
      >
        <Avatar size="lg" className="size-9">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt={user.displayName} /> : null}
          <AvatarFallback className="bg-[#e85d4a] text-sm font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate text-[14px] font-medium">{user.displayName}</span>
        <ChevronDown
          className={cn(
            "text-muted-foreground size-4 shrink-0 transition-transform",
            menuOpen && "rotate-180"
          )}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={6}
        className="min-w-[168px] rounded-xl border border-black/8 bg-white p-1 shadow-md ring-0"
      >
        {settingsMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <DropdownMenuItem
              key={item.id}
              className="gap-2.5 rounded-lg px-2.5 py-2"
              onClick={() => {
                setMenuOpen(false);
                onOpenSection(item.id);
              }}
            >
              <Icon className="size-4" />
              {item.label}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator className="my-1 bg-black/8" />
        <DropdownMenuItem
          variant="destructive"
          className="gap-2.5 rounded-lg px-2.5 py-2"
          onClick={() => {
            setMenuOpen(false);
            onSignOut();
          }}
        >
          <LogOut className="size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  const router = useRouter();
  const openCommandBar = useCommandBarStore((state) => state.open);
  const resetCommandSession = useCommandBarStore((state) => state.resetSessionState);
  const commandShortcutKeys = useCommandShortcutKeys();

  const initials =
    user.displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || user.username.slice(0, 2).toUpperCase();

  const openSettings = useCallback(
    (section: SettingsSection = "general") => {
      router.push(`/settings?section=${section}`);
      onNavigate?.();
    },
    [router, onNavigate]
  );

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  useEffect(() => {
    function onOpenSettings() {
      openSettings("general");
    }

    window.addEventListener("hcms:open-settings", onOpenSettings);
    return () => window.removeEventListener("hcms:open-settings", onOpenSettings);
  }, [openSettings]);

  return (
    <aside
        className={cn(
          "flex h-full max-h-full flex-col overflow-hidden rounded-[28px] bg-white px-3 py-4 shadow-sm",
          className
        )}
      >
        <UserMenuButton
          user={user}
          initials={initials}
          onOpenSection={openSettings}
          onSignOut={() => void handleSignOut()}
        />

        <div className="space-y-0.5">
          <UtilityButton
            icon={Search}
            label="Search"
            shortcutKeys={commandShortcutKeys}
            onClick={() => {
              resetCommandSession();
              openCommandBar();
              onNavigate?.();
            }}
          />
          <UtilityLink icon={Clock3} label="Recent" href="/cms" onNavigate={onNavigate} />
        </div>

        <SidebarDivider />

        <nav className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <NavSection items={overviewNav} pathname={pathname} onNavigate={onNavigate} />

          <SidebarDivider />

          <NavSection items={contentNav} pathname={pathname} onNavigate={onNavigate} />
        </nav>

        <div className="mt-4">
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
  );
}
