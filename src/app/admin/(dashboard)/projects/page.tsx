import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, AdminSkeleton } from "@/components/admin/ui";
import { ProjectsTable } from "@/components/admin/projects/projects-table";
import { requireAdmin } from "@/lib/auth/dal";
import { getAdminProjects } from "@/lib/content/admin-queries";

export const metadata = { title: "Projects" };

async function AdminProjectsPageContent() {
  await requireAdmin();
  const projects = await getAdminProjects();
  return (
    <>
      <PageHeader
        title="Projects"
        description="Case studies shown on the website. Drag the handle (⋮⋮) to set the display order."
        actions={
          <Button asChild>
            <Link href="/admin/projects/new">
              <Plus /> New project
            </Link>
          </Button>
        }
      />
      <ProjectsTable projects={projects} />
    </>
  );
}

export default function AdminProjectsPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminProjectsPageContent />
    </Suspense>
  );
}
