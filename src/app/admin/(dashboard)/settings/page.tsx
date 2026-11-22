import { Suspense } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, AdminSkeleton } from "@/components/admin/ui";
import { SettingsEditor } from "@/components/admin/content-editors";
import { requireAdmin } from "@/lib/auth/dal";
import { getAdminSettings } from "@/lib/content/admin-queries";
import type { SiteSettingKey } from "@/lib/validations/settings";

export const metadata = { title: "Settings" };

async function AdminSettingsPageContent() {
  await requireAdmin();
  const settings = await getAdminSettings();
  return (
    <>
      <PageHeader
        title="Settings"
        description="Brand, contact details, social links, footer, SEO defaults, navigation and enquiry notifications."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/account/password">
              <KeyRound /> Change password
            </Link>
          </Button>
        }
      />
      <SettingsEditor settings={settings as unknown as Record<SiteSettingKey, Record<string, unknown>>} />
    </>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminSettingsPageContent />
    </Suspense>
  );
}
