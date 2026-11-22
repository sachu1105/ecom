import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminSkeleton } from "@/components/admin/ui";

/*
 * The shell is static. Every page below calls requireAdmin() itself, because
 * layouts are not re-rendered on client-side navigation between pages and
 * therefore cannot be the authorisation boundary.
 */
export default function DashboardLayout({ children }: LayoutProps<"/admin">) {
  return (
    <AdminShell>
      <Suspense fallback={<AdminSkeleton />}>{children}</Suspense>
    </AdminShell>
  );
}
