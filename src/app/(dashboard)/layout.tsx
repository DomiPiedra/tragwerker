import { requireUser } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard-shell";
import { GlobalCommandBar } from "@/components/command/global-command-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <DashboardShell
      user={{
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
      }}
    >
      {children}
      <GlobalCommandBar />
    </DashboardShell>
  );
}
