import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, AdminSkeleton } from "@/components/admin/ui";
import { ProjectDetailsForm } from "@/components/admin/projects/project-details-form";
import { requireAdmin } from "@/lib/auth/dal";
import { getAdminCategories } from "@/lib/content/admin-queries";

export const metadata = { title: "New project" };

async function NewProjectPageContent() {
  await requireAdmin();
  const categories = await getAdminCategories();
  return (
    <>
      <PageHeader
        title="New project"
        description="Start with the details. You can add photographs and sections next."
        actions={
          <Button asChild variant="ghost">
            <Link href="/admin/projects">
              <ArrowLeft /> All projects
            </Link>
          </Button>
        }
      />
      <ProjectDetailsForm project={null} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <NewProjectPageContent />
    </Suspense>
  );
}
