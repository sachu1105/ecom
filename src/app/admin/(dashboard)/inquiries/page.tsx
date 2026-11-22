import { Suspense } from "react";
import { PageHeader, AdminSkeleton } from "@/components/admin/ui";
import { InquiriesInbox } from "@/components/admin/inquiries-inbox";
import { requireAdmin } from "@/lib/auth/dal";
import { getAdminInquiries, getAdminProjects } from "@/lib/content/admin-queries";

export const metadata = { title: "Enquiries" };

const STATUSES = ["all", "new", "read", "archived"] as const;

async function AdminInquiriesPageContent({ searchParams }: PageProps<"/admin/inquiries">) {
  await requireAdmin();
  const params = await searchParams;
  const status = STATUSES.find((s) => s === params.status) ?? "all";
  const openId = typeof params.open === "string" ? params.open : undefined;
  const [inquiries, projects] = await Promise.all([getAdminInquiries(status), getAdminProjects()]);
  const projectSlugs = Object.fromEntries(projects.filter((p) => p.status === "published").map((p) => [p.id, p.slug]));

  return (
    <>
      <PageHeader title="Enquiries" description="Messages from the contact form. Only administrators can see these." />
      <InquiriesInbox
        key={status}
        inquiries={inquiries}
        status={status}
        openId={openId}
        projectSlugs={projectSlugs}
      />
    </>
  );
}

export default function AdminInquiriesPage(props: PageProps<"/admin/inquiries">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminInquiriesPageContent {...props} />
    </Suspense>
  );
}
