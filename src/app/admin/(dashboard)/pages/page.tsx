import { Suspense } from "react";
import { PageHeader, AdminSkeleton } from "@/components/admin/ui";
import { PagesEditor } from "@/components/admin/content-editors";
import { requireAdmin } from "@/lib/auth/dal";
import { getAdminPages } from "@/lib/content/admin-queries";

export const metadata = { title: "Pages" };

async function AdminPagesPageContent({ searchParams }: PageProps<"/admin/pages">) {
  await requireAdmin();
  const [pages, { tab }] = await Promise.all([getAdminPages(), searchParams]);
  return (
    <>
      <PageHeader title="Pages" description="Edit the About, Projects and Contact pages. Changes go live when you save." />
      <PagesEditor pages={pages} initial={typeof tab === "string" ? tab : undefined} />
    </>
  );
}

export default function AdminPagesPage(props: PageProps<"/admin/pages">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminPagesPageContent {...props} />
    </Suspense>
  );
}
