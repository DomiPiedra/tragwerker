import { redirect } from "next/navigation";

import { loginWithPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/cms");
  }

  const resolvedSearchParams = await searchParams;
  const errorRaw = resolvedSearchParams.error;
  const errorParam = Array.isArray(errorRaw) ? errorRaw[0] : errorRaw;
  const internalCodes = new Set(["NEXT_REDIRECT", "NEXT_NOT_FOUND"]);
  const error =
    errorParam && !internalCodes.has(errorParam) ? errorParam : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to H CMS</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={loginWithPassword} className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium">
                Username
              </label>
              <Input id="username" name="username" autoComplete="username" required />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
