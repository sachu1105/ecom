import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, FolderKanban, Inbox, Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, Panel, AdminSkeleton } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { getDashboardStats } from "@/lib/content/admin-queries";
import { formatDateTime } from "@/lib/utils/format";

export const metadata = { title: "Overview" };

async function AdminOverviewPageContent() {
  const user = await requireAdmin();
  const stats = await getDashboardStats();

  const cards = [
    { label: "Total projects", value: stats.totalProjects, href: "/admin/projects", icon: FolderKanban },
    { label: "Published", value: stats.publishedProjects, href: "/admin/projects", icon: FolderKanban },
    { label: "Drafts", value: stats.draftProjects, href: "/admin/projects", icon: FolderKanban },
    { label: "Categories", value: stats.totalCategories, href: "/admin/categories", icon: Tags },
    { label: "Enquiries", value: stats.totalInquiries, href: "/admin/inquiries", icon: Inbox, note: stats.unreadInquiries ? `${stats.unreadInquiries} new` : undefined },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Signed in as ${user.email}`}
        actions={
          <Button asChild>
            <Link href="/admin/projects/new">
              <Plus /> New project
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border bg-background p-4 transition-colors hover:border-foreground/30"
          >
            <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{card.value}</p>
            {card.note && <Badge className="mt-2">{card.note}</Badge>}
          </Link>
        ))}
      </div>

      <Panel
        className="mt-8"
        title="Recent enquiries"
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/inquiries">
              View all <ArrowRight />
            </Link>
          </Button>
        }
      >
        {stats.recentInquiries.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No enquiries yet.</p>
        ) : (
          <ul className="-my-2 divide-y">
            {stats.recentInquiries.map((inquiry) => (
              <li key={inquiry.id}>
                <Link href={`/admin/inquiries?open=${inquiry.id}`} className="flex items-start justify-between gap-4 py-3 hover:opacity-80">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium">
                      {inquiry.name}
                      {inquiry.status === "new" && <Badge>New</Badge>}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {inquiry.subject || inquiry.project_title || inquiry.message}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground" dateTime={inquiry.created_at}>
                    {formatDateTime(inquiry.created_at)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

export default function AdminOverviewPage() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminOverviewPageContent />
    </Suspense>
  );
}
