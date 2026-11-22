import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, AdminSkeleton } from "@/components/admin/ui";
import { ProjectDetailsForm } from "@/components/admin/projects/project-details-form";
import { ProjectGalleryEditor } from "@/components/admin/projects/project-gallery-editor";
import { ProjectSectionsEditor } from "@/components/admin/projects/project-sections-editor";
import { requireAdmin } from "@/lib/auth/dal";
import { getAdminCategories, getAdminProject } from "@/lib/content/admin-queries";

export const metadata = { title: "Edit project" };

const TABS = ["details", "gallery", "sections"] as const;

async function EditProjectPageContent({ params, searchParams }: PageProps<"/admin/projects/[id]/edit">) {
  await requireAdmin();
  const [{ id }, { tab }] = await Promise.all([params, searchParams]);
  const [{ project, media, sections }, categories] = await Promise.all([getAdminProject(id), getAdminCategories()]);
  const initial = TABS.includes(tab as (typeof TABS)[number]) ? (tab as string) : "details";

  return (
    <>
      <PageHeader
        title={project.title}
        description={`/projects/${project.slug}`}
        actions={
          <>
            <Badge variant={project.status === "published" ? "default" : "secondary"} className="h-8 px-3 capitalize">
              {project.status}
            </Badge>
            {project.status === "published" && (
              <Button asChild variant="outline">
                <a href={`/projects/${project.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink /> View
                </a>
              </Button>
            )}
            <Button asChild variant="ghost">
              <Link href="/admin/projects">
                <ArrowLeft /> All projects
              </Link>
            </Button>
          </>
        }
      />
      <Tabs defaultValue={initial} className="gap-6">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="gallery">Gallery ({media.length})</TabsTrigger>
          <TabsTrigger value="sections">Sections ({sections.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <ProjectDetailsForm project={project} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
        </TabsContent>
        <TabsContent value="gallery">
          <ProjectGalleryEditor projectId={project.id} media={media} />
        </TabsContent>
        <TabsContent value="sections">
          <ProjectSectionsEditor projectId={project.id} sections={sections} />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default function EditProjectPage(props: PageProps<"/admin/projects/[id]/edit">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <EditProjectPageContent {...props} />
    </Suspense>
  );
}
