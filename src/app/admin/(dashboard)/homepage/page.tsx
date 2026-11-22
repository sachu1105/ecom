import { Suspense } from "react";
import { PageHeader, AdminSkeleton } from "@/components/admin/ui";
import { HomepageEditor } from "@/components/admin/homepage-editor";
import { requireAdmin } from "@/lib/auth/dal";
import { getAdminHomepage } from "@/lib/content/admin-queries";

export const metadata = { title: "Homepage" };

async function AdminHomepagePageContent() {
  await requireAdmin();
  const sections = await getAdminHomepage();
  return (
    <>
      <PageHeader
        title="Homepage"
        description="Build the homepage from predefined sections. Edits are saved as drafts until you publish; new sections start hidden."
      />
      <HomepageEditor sections={sections} />
    </>
  );
}

export default function AdminHomepagePage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminHomepagePageContent />
    </Suspense>
  );
}
