"use client";

import { useEffect, useState } from "react";
import type { ComponentType, FormEvent } from "react";
import { Link2, Settings, ShieldUser, UserCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export type SettingsSection = "me" | "general" | "links" | "users";

export const settingsMenuItems: Array<{
  id: SettingsSection;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { id: "me", label: "Account", icon: UserCircle2 },
  { id: "general", label: "Settings", icon: Settings },
  { id: "links", label: "Links", icon: Link2 },
  { id: "users", label: "Users", icon: ShieldUser },
];

export function parseSettingsSection(value: string | null | undefined): SettingsSection {
  if (value === "me" || value === "general" || value === "links" || value === "users") {
    return value;
  }
  return "me";
}

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

type SettingsViewProps = {
  section: SettingsSection;
};

const sectionDescriptions: Record<SettingsSection, string> = {
  me: "Update your profile and password.",
  general: "Workspace preferences.",
  links: "External links used across the site.",
  users: "Manage who can access the CMS.",
};

export function SettingsView({ section }: SettingsViewProps) {
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
  }, []);

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
          avatarUrl: currentUser?.avatarUrl ?? null,
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
        displayName: data.user!.displayName,
        username: data.user!.username,
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

      setUsers((prev) => [...prev, data.user!]);
      setCreateForm({ username: "", displayName: "", password: "", role: "editor" });
    } catch {
      setUserError("Failed to create user.");
    }
  }

  const sectionTitle =
    settingsMenuItems.find((item) => item.id === section)?.label ?? "Settings";

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">{sectionTitle}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{sectionDescriptions[section]}</p>
      </div>

      {section === "me" ? (
        <form onSubmit={handleUpdateMe} className="space-y-6">
          <div className="space-y-3">
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
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Change password</p>
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

          {meError ? <p className="text-destructive text-sm">{meError}</p> : null}
          {meSuccess ? <p className="text-emerald-600 text-sm">{meSuccess}</p> : null}
          <Button type="submit" size="sm" disabled={isSavingMe}>
            {isSavingMe ? "Saving..." : "Save profile"}
          </Button>
        </form>
      ) : null}

      {section === "general" ? (
        <div className="space-y-6">
          {isLoading ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
          <div className="space-y-2">
            <p className="text-sm font-medium">Workspace name</p>
            <Input defaultValue="H CMS" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Default language</p>
            <Input defaultValue="English" />
          </div>
        </div>
      ) : null}

      {section === "links" ? (
        <div className="space-y-3">
          <p className="text-sm font-medium">External links</p>
          <Input placeholder="https://example.com" />
          <p className="text-muted-foreground text-xs">
            Manage external links here instead of the main sidebar.
          </p>
        </div>
      ) : null}

      {section === "users" ? (
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-medium">User management</p>
            {userError ? <p className="text-destructive text-sm">{userError}</p> : null}
            {isLoading ? <p className="text-muted-foreground text-sm">Loading...</p> : null}
            <ul className="divide-y divide-black/8">
              {users.map((user) => (
                <li key={user.id} className="py-3 first:pt-0">
                  <p className="text-sm font-medium">{user.displayName}</p>
                  <p className="text-muted-foreground text-xs">
                    @{user.username} · {user.role}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {currentUser?.role === "admin" ? (
            <>
              <Separator />
              <form onSubmit={handleCreateUser} className="space-y-3">
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
                  className="border-input bg-background h-9 w-full rounded-lg border px-2.5 text-sm"
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <Button type="submit" size="sm">
                  Create user
                </Button>
              </form>
            </>
          ) : (
            <p className="text-muted-foreground text-xs">Only admins can create users.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
