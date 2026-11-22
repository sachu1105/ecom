import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/auth-forms";
import { NotConfigured } from "@/components/admin/ui";
import { getAdminUser } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = { title: "Sign in" };

async function LoginGate({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  // Already signed in? Skip the form.
  const user = await getAdminUser();
  if (user) redirect(user.mustChangePassword ? "/admin/account/password" : "/admin");
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <div className="grid min-h-svh place-items-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Content studio</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
        </div>
        {isSupabaseConfigured() ? (
          <div className="rounded-lg border bg-background p-6 shadow-sm">
            <Suspense fallback={<div className="h-56 animate-pulse rounded bg-muted" />}>
              <LoginGate searchParams={searchParams} />
            </Suspense>
          </div>
        ) : (
          <NotConfigured />
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Access is restricted to authorised administrators.
        </p>
      </div>
    </div>
  );
}
