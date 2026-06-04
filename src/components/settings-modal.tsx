"use client";

import { useEffect, useState } from "react";
import type { ComponentType, FormEvent } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Link2, LogOut, Settings, ShieldUser, UserCircle2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SettingsSection = "me" | "general" | "links" | "users";

const sections: Array<{
  id: SettingsSection;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: "general", label: "General", icon: Settings },
  { id: "links", label: "Links", icon: Link2 },
  { id: "users", label: "Users", icon: ShieldUser },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type CurrentUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: "admin" | "editor";
};

type ManagedUser = {
  id: string;
  username: string;
  displayName: string;
  role: "admin" | "editor";
  createdAt: string;
};

export function SettingsModal({ open, onOpenChange }: Props) {
  const [activeSection, setActiveSection] = useState<SettingsSection>("me");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [userError, setUserError] = useState<string | null>(null);
  const [meError, setMeError] = useState<string | null>(null);
  const [meSuccess, setMeSuccess] = useState<string | null>(null);
  const [isSavingMe, setIsSavingMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [meForm, setMeForm] = useState({
    displayName: "",
    username: "",
    avatarUrl: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [createForm, setCreateForm] = useState({
    username: "",
    displayName: "",
    password: "",
    role: "editor" as "admin" | "editor",
  });

  useEffect(() => {
    if (!open) return;

    async function load() {
      setIsLoading(true);
      setUserError(null);
      try {
        const [meRes, usersRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/admin/users"),
        ]);

        if (meRes.ok) {
          const meData = (await meRes.json()) as { user: CurrentUser };
          setCurrentUser(meData.user);
          setMeForm((prev) => ({
            ...prev,
            displayName: meData.user.displayName,
            username: meData.user.username,
            avatarUrl: meData.user.avatarUrl ?? "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }));
        } else {
          setCurrentUser(null);
        }

        if (usersRes.ok) {
          const usersData = (await usersRes.json()) as { users: ManagedUser[] };
          setUsers(usersData.users);
        } else {
          setUsers([]);
        }
      } catch {
        setUserError("Could not load settings data.");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [open]);

  async function handleUpdateMe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMeError(null);
    setMeSuccess(null);
    if (meForm.newPassword && meForm.newPassword !== meForm.confirmPassword) {
      setMeError("New password and confirm password do not match.");
      return;
    }

    setIsSavingMe(true);
    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: meForm.displayName,
          username: meForm.username,
          avatarUrl: meForm.avatarUrl,
          currentPassword: meForm.currentPassword,
          newPassword: meForm.newPassword,
        }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        user?: CurrentUser;
      };
      if (!response.ok || !data.ok || !data.user) {
        setMeError(data.error ?? "Could not update profile.");
        return;
      }

      setCurrentUser(data.user);
      setMeForm((prev) => ({
        ...prev,
        displayName: data.user?.displayName ?? prev.displayName,
        username: data.user?.username ?? prev.username,
        avatarUrl: data.user?.avatarUrl ?? "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      setMeSuccess("Profile updated.");
    } catch {
      setMeError("Could not update profile.");
    } finally {
      setIsSavingMe(false);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUserError(null);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        user?: ManagedUser;
      };
      if (!response.ok || !data.ok || !data.user) {
        setUserError(data.error ?? "Failed to create user.");
        return;
      }

      setUsers((prev) => [...prev, data.user]);
      setCreateForm({ username: "", displayName: "", password: "", role: "editor" });
    } catch {
      setUserError("Failed to create user.");
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[140] bg-black/30 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="bg-background/95 border-border fixed top-1/2 left-1/2 z-[150] flex h-[min(76vh,640px)] w-[min(900px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border shadow-2xl transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
          <aside className="bg-muted/30 border-border w-64 border-r p-3">
            <button
              type="button"
              className={cn(
                "border-border mb-4 w-full rounded-xl border p-3 text-left",
                activeSection === "me" ? "bg-muted" : "hover:bg-muted/50"
              )}
              onClick={() => setActiveSection("me")}
            >
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarImage src={currentUser?.avatarUrl ?? ""} alt={currentUser?.displayName ?? "User"} />
                  <AvatarFallback>
                    <UserCircle2 className="size-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">
                    {currentUser?.displayName ?? "Not signed in"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {currentUser ? `${currentUser.role} · @${currentUser.username}` : "Guest"}
                  </p>
                </div>
              </div>
            </button>

            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "hover:bg-muted flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm",
                    activeSection === section.id ? "bg-muted text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  <section.icon className="size-4" />
                  {section.label}
                </button>
              ))}
            </nav>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-4 w-full justify-start"
              onClick={() => {
                void handleLogout();
              }}
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="border-border flex items-center justify-between border-b px-5 py-3">
              <Dialog.Title className="font-heading text-lg font-semibold">
                {activeSection === "me"
                  ? "Me"
                  : sections.find((section) => section.id === activeSection)?.label ?? "Settings"}
              </Dialog.Title>
              <Dialog.Close
                render={<Button size="icon-sm" variant="ghost" aria-label="Close settings" />}
              >
                <span className="text-base leading-none">&times;</span>
              </Dialog.Close>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {activeSection === "me" ? (
                <form onSubmit={handleUpdateMe} className="max-w-xl space-y-3">
                  <p className="text-sm font-medium">My profile</p>
                  <Input
                    placeholder="Display name"
                    value={meForm.displayName}
                    onChange={(event) =>
                      setMeForm((prev) => ({ ...prev, displayName: event.target.value }))
                    }
                    required
                  />
                  <Input
                    placeholder="Username"
                    value={meForm.username}
                    onChange={(event) =>
                      setMeForm((prev) => ({ ...prev, username: event.target.value }))
                    }
                    required
                  />
                  <Input
                    placeholder="Profile picture URL"
                    value={meForm.avatarUrl}
                    onChange={(event) =>
                      setMeForm((prev) => ({ ...prev, avatarUrl: event.target.value }))
                    }
                  />
                  <div className="border-border rounded-lg border p-3">
                    <p className="mb-2 text-sm font-medium">Change password</p>
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="Current password"
                        value={meForm.currentPassword}
                        onChange={(event) =>
                          setMeForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                        }
                      />
                      <Input
                        type="password"
                        placeholder="New password"
                        value={meForm.newPassword}
                        onChange={(event) =>
                          setMeForm((prev) => ({ ...prev, newPassword: event.target.value }))
                        }
                      />
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={meForm.confirmPassword}
                        onChange={(event) =>
                          setMeForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  {meError ? <p className="text-destructive text-sm">{meError}</p> : null}
                  {meSuccess ? <p className="text-emerald-600 text-sm">{meSuccess}</p> : null}
                  <Button type="submit" size="sm" disabled={isSavingMe}>
                    {isSavingMe ? "Saving..." : "Save profile"}
                  </Button>
                </form>
              ) : null}

              {activeSection === "general" ? (
                <div className="max-w-xl space-y-4">
                  {isLoading ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
                  <div>
                    <p className="text-sm font-medium">Workspace name</p>
                    <Input defaultValue="H CMS" className="mt-1.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Default language</p>
                    <Input defaultValue="English" className="mt-1.5" />
                  </div>
                </div>
              ) : null}

              {activeSection === "links" ? (
                <div className="max-w-xl space-y-4">
                  <p className="text-sm font-medium">External links</p>
                  <Input placeholder="https://example.com" />
                  <p className="text-muted-foreground text-xs">
                    Manage all external links here instead of the main sidebar.
                  </p>
                </div>
              ) : null}

              {activeSection === "users" ? (
                <div className="max-w-xl space-y-4">
                  <p className="text-sm font-medium">User management</p>
                  {userError ? <p className="text-destructive text-sm">{userError}</p> : null}

                  <div className="space-y-2">
                    {users.map((user) => (
                      <div key={user.id} className="border-border rounded-lg border p-3">
                        <p className="text-sm font-medium">{user.displayName}</p>
                        <p className="text-muted-foreground text-xs">
                          @{user.username} · {user.role}
                        </p>
                      </div>
                    ))}
                  </div>

                  {currentUser?.role === "admin" ? (
                    <form onSubmit={handleCreateUser} className="space-y-2 rounded-lg border p-3">
                      <p className="text-sm font-medium">Create new user</p>
                      <Input
                        placeholder="Username"
                        value={createForm.username}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, username: event.target.value }))
                        }
                        required
                      />
                      <Input
                        placeholder="Display name"
                        value={createForm.displayName}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, displayName: event.target.value }))
                        }
                      />
                      <Input
                        type="password"
                        placeholder="Password (min 8)"
                        value={createForm.password}
                        onChange={(event) =>
                          setCreateForm((prev) => ({ ...prev, password: event.target.value }))
                        }
                        required
                      />
                      <select
                        value={createForm.role}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            role: event.target.value === "admin" ? "admin" : "editor",
                          }))
                        }
                        className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm"
                      >
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button type="submit" size="sm">
                        Create user
                      </Button>
                    </form>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Only admins can create users.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
