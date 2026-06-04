"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";

import {
  createSessionForUser,
  ensureBootstrapAdmin,
  findUserByUsername,
  hashPassword,
  updateUserPasswordHash,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function loginWithPassword(formData: FormData) {
  try {
    const username = formData.get("username")?.toString().trim() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    await ensureBootstrapAdmin();

    if (!username || !password) {
      redirect("/login?error=Username%20and%20password%20are%20required.");
    }

    const userCount = await prisma.user.count();
    if (userCount === 0) {
      redirect(
        `/login?error=${encodeURIComponent(
          "No accounts yet. Add AUTH_BOOTSTRAP_ADMIN_USERNAME and AUTH_BOOTSTRAP_ADMIN_PASSWORD to .env.local (see .env.example), restart the dev server, then sign in."
        )}`
      );
    }

    const user = await findUserByUsername(username);
    if (!user) {
      redirect("/login?error=Invalid%20credentials.");
    }

    let valid = await verifyPassword(password, user.passwordHash);
    if (!valid && user.passwordHash === password) {
      // Backward-compatibility path for users created manually in Prisma Studio.
      await updateUserPasswordHash(user.id, await hashPassword(password));
      valid = true;
    }
    if (!valid) {
      redirect("/login?error=Invalid%20credentials.");
    }

    await createSessionForUser(user.id);
    redirect("/");
  } catch (error) {
    if (isRedirectError(error)) throw error;
    const message =
      error instanceof Error
        ? error.message
        : "Login setup failed. Run prisma migration and retry.";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }
}
