"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Pencil, Search, Star, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAction } from "@/components/admin/use-action";
import { SortableList } from "@/components/admin/sortable-list";
import {
  deleteProjectAction,
  reorderProjectsAction,
  setProjectFeaturedAction,
  setProjectStatusAction,
} from "@/lib/actions/projects";
import { resolveMediaUrl } from "@/lib/content/media";
import { formatDate } from "@/lib/utils/format";
import type { ProjectRow } from "@/types/database";
import { cn } from "@/lib/utils";

type Row = ProjectRow & { category_name: string | null };

export function ProjectsTable({ projects }: { projects: Row[] }) {
  const [order, setOrder] = useState(projects);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const { run, pending } = useAction();

  // Re-sync when the server sends new data.
  const [source, setSource] = useState(projects);
  if (source !== projects) {
    setSource(projects);
    setOrder(projects);
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return order.filter(
      (p) =>
        (status === "all" || p.status === status) &&
        (!needle || [p.title, p.slug, p.category_name, p.location].some((v) => v?.toLowerCase().includes(needle))),
    );
  }, [order, q, status]);

  // Reordering a filtered subset would be ambiguous, so it needs the full list.
  const canReorder = !q && status === "all";

  const reorder = (next: Row[]) => {
    setOrder(next);
    run(() => reorderProjectsAction(next.map((p) => p.id)), { success: "Order updated.", refresh: false });
  };

  const renderRow = (p: Row, handle?: React.ReactNode) => {
    const cover = resolveMediaUrl(p.cover_image_path);
    return (
      <div className="flex flex-wrap items-center gap-4 p-4 md:flex-nowrap">
        {handle}
        <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded bg-muted">
          {cover && <Image src={cover} alt="" fill sizes="80px" className="object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <Link href={`/admin/projects/${p.id}/edit`} className="font-medium hover:underline">
            {p.title}
          </Link>
          <p className="truncate text-sm text-muted-foreground">
            {[p.category_name ?? "Uncategorised", p.location, `Updated ${formatDate(p.updated_at)}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Badge variant={p.status === "published" ? "default" : "secondary"} className="capitalize">
          {p.status}
        </Badge>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              checked={p.status === "published"}
              disabled={pending}
              onCheckedChange={(v) => run(() => setProjectStatusAction(p.id, v ? "published" : "draft"))}
              aria-label={`Publish ${p.title}`}
            />
            <span className="hidden sm:inline">Live</span>
          </label>
          <Button
            size="icon-sm"
            variant="ghost"
            disabled={pending}
            onClick={() => run(() => setProjectFeaturedAction(p.id, !p.is_featured))}
            aria-label={p.is_featured ? `Unfeature ${p.title}` : `Feature ${p.title}`}
            aria-pressed={p.is_featured}
          >
            <Star className={cn(p.is_featured && "fill-amber-400 text-amber-500")} />
          </Button>
          {p.status === "published" && (
            <Button asChild size="icon-sm" variant="ghost">
              <a href={`/projects/${p.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${p.title} on the website`}>
                <ExternalLink />
              </a>
            </Button>
          )}
          <Button asChild size="icon-sm" variant="ghost">
            <Link href={`/admin/projects/${p.id}/edit`} aria-label={`Edit ${p.title}`}>
              <Pencil />
            </Link>
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => setToDelete(p)} aria-label={`Delete ${p.title}`}>
            <Trash2 />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:w-72">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search projects" className="pl-8" aria-label="Search projects" />
        </div>
        <div className="flex gap-1 rounded-md bg-muted p-1 text-sm" role="group" aria-label="Filter by status">
          {(["all", "published", "draft"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={cn("rounded px-3 py-1 capitalize", status === s ? "bg-background shadow-sm" : "text-muted-foreground")}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-sm text-muted-foreground">
          {projects.length === 0 ? "No projects yet. Create your first case study." : "No projects match these filters."}
        </div>
      ) : canReorder ? (
        <SortableList
          items={order}
          onReorder={reorder}
          getLabel={(p) => p.title}
          disabled={pending}
          className="divide-y"
          renderItem={renderRow}
        />
      ) : (
        <>
          <p className="border-b bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            Clear the search and show all projects to change the order.
          </p>
          <ul className="divide-y">
            {filtered.map((p) => (
              <li key={p.id}>{renderRow(p)}</li>
            ))}
          </ul>
        </>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              The project, its gallery list and sections are removed permanently. Files stay in the media library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (toDelete) run(() => deleteProjectAction(toDelete.id));
                setToDelete(null);
              }}
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
