import { Suspense } from "react";
import { PageHeader, AdminSkeleton } from "@/components/admin/ui";
import { CategoriesManager } from "@/components/admin/categories-manager";
import { requireAdmin } from "@/lib/auth/dal";
import { getAdminCategories } from "@/lib/content/admin-queries";

export const metadata = { title: "Categories" };

async function AdminCategoriesPageContent() {
  await requireAdmin();
  const categories = await getAdminCategories();
  return (
    <>
      <PageHeader
        title="Categories"
        description="Applications and film types. New categories appear in the menu, filters and homepage automatically."
      />
      <CategoriesManager categories={categories} />
    </>
  );
}

export default function AdminCategoriesPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminCategoriesPageContent />
    </Suspense>
  );
}
