import { Suspense } from "react";
import Link from "next/link";
import { ChangePasswordForm } from "@/components/admin/auth-forms";
import { requireAdmin } from "@/lib/auth/dal";

export const metadata = { title: "Change password" };

async function PasswordGate() {
  const user = await requireAdmin({ allowPasswordChange: true });
  return (
    <>
      <p className="mb-5 text-center text-sm text-muted-foreground">{user.email}</p>
      <ChangePasswordForm forced={user.mustChangePassword} />
      {!user.mustChangePassword && (
        <p className="mt-5 text-center text-sm">
          <Link href="/admin" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Back to dashboard
          </Link>
        </p>
      )}
    </>
  );
}

export default function ChangePasswordPage() {
  return (
    <div className="grid min-h-svh place-items-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight">Change password</h1>
        <div className="rounded-lg border bg-background p-6 shadow-sm">
          <Suspense fallback={<div className="h-64 animate-pulse rounded bg-muted" />}>
            <PasswordGate />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
