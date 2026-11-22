import { Suspense } from "react";
import { PageHeader, AdminSkeleton } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/media-library";
import { requireAdmin } from "@/lib/auth/dal";
import { listMediaAction } from "@/lib/actions/media";

export const metadata = { title: "Media" };

async function AdminMediaPageContent() {
  await requireAdmin();
  const result = await listMediaAction({ type: "all" });
  return (
    <>
      <PageHeader title="Media library" description="Images and videos shared across projects, pages and the homepage." />
      <MediaLibrary initial={result.ok ? (result.data ?? []) : []} />
    </>
  );
}

export default function AdminMediaPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminMediaPageContent />
    </Suspense>
  );
}
