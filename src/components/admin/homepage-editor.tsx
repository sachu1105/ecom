"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { FieldEditor } from "@/components/admin/fields/field-editor";
import { useAction } from "@/components/admin/use-action";
import { SortableList } from "@/components/admin/sortable-list";
import { HOMEPAGE_SECTION_META } from "@/config/fields";
import {
  addHomepageSectionAction,
  deleteHomepageSectionAction,
  discardHomepageDraftAction,
  publishAllHomepageDraftsAction,
  publishHomepageSectionAction,
  reorderHomepageSectionsAction,
  saveHomepageDraftAction,
  setHomepageSectionEnabledAction,
} from "@/lib/actions/homepage";
import { HOMEPAGE_SECTION_TYPES, type HomepageSectionType } from "@/lib/validations/sections";
import { formatDateTime } from "@/lib/utils/format";

type Values = { title: string; content: Record<string, unknown>; settings: Record<string, unknown> };
export type AdminHomepageSection = {
  id: string;
  type: HomepageSectionType;
  isEnabled: boolean;
  live: Values;
  draft: (Values & { updatedAt: string }) | null;
  updatedAt: string;
};

function summary(section: AdminHomepageSection) {
  const v = section.draft ?? section.live;
  const heading = (v.content.heading as string) || (v.content.eyebrow as string) || "";
  return v.title || heading || "Untitled";
}

function SectionSheet({
  section,
  onOpenChange,
}: {
  section: AdminHomepageSection;
  onOpenChange: (open: boolean) => void;
}) {
  const meta = HOMEPAGE_SECTION_META[section.type];
  const [values, setValues] = useState<Values>(() => {
    const base = section.draft ?? section.live;
    return { title: base.title, content: { ...base.content }, settings: { ...base.settings } };
  });
  const { run, pending } = useAction();

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b p-5">
          <SheetTitle>{meta.label}</SheetTitle>
          <SheetDescription>
            {section.draft ? `Editing draft saved ${formatDateTime(section.draft.updatedAt)}.` : meta.description}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-8 overflow-y-auto p-5">
          <div className="space-y-2">
            <Label htmlFor="section-title">Internal label</Label>
            <Input
              id="section-title"
              value={values.title}
              maxLength={200}
              placeholder="Only shown in the dashboard"
              onChange={(e) => setValues({ ...values, title: e.target.value })}
            />
          </div>
          <div>
            <h3 className="mb-4 text-sm font-semibold">Content</h3>
            <FieldEditor fields={meta.content} value={values.content} onChange={(content) => setValues({ ...values, content })} />
          </div>
          {meta.settings.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="mb-4 text-sm font-semibold">Display settings</h3>
                <FieldEditor fields={meta.settings} value={values.settings} onChange={(settings) => setValues({ ...values, settings })} />
              </div>
            </>
          )}
        </div>
        <SheetFooter className="flex-row flex-wrap justify-end gap-2 border-t p-4">
          {section.draft && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => discardHomepageDraftAction(section.id), { onSuccess: () => onOpenChange(false) })}
            >
              Discard draft
            </Button>
          )}
          <Button type="button" variant="outline" disabled={pending} onClick={() => run(() => saveHomepageDraftAction(section.id, values))}>
            Save draft
          </Button>
          <Button
            type="button"
            disabled={pending}
            onClick={() => run(() => publishHomepageSectionAction(section.id, values), { onSuccess: () => onOpenChange(false) })}
          >
            {pending && <Loader2 className="animate-spin" />}
            Publish
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function HomepageEditor({ sections }: { sections: AdminHomepageSection[] }) {
  const [order, setOrder] = useState(sections);
  const [source, setSource] = useState(sections);
  if (source !== sections) {
    setSource(sections);
    setOrder(sections);
  }
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<AdminHomepageSection | null>(null);
  const { run, pending } = useAction();
  const editing = order.find((s) => s.id === editingId) ?? null;
  const draftCount = order.filter((s) => s.draft).length;

  const reorder = (next: AdminHomepageSection[]) => {
    setOrder(next);
    run(() => reorderHomepageSectionsAction(next.map((s) => s.id)), { success: "Order updated.", refresh: false });
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {draftCount > 0 ? `${draftCount} section${draftCount > 1 ? "s have" : " has"} unpublished changes.` : "All changes are published."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/homepage/preview" target="_blank">
              <Eye /> Preview
            </Link>
          </Button>
          {draftCount > 0 && (
            <Button variant="outline" disabled={pending} onClick={() => run(() => publishAllHomepageDraftsAction())}>
              <Upload /> Publish all drafts
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus /> Add section
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              {HOMEPAGE_SECTION_TYPES.map((type) => (
                <DropdownMenuItem
                  key={type}
                  className="flex-col items-start gap-0.5"
                  onSelect={() =>
                    run(() => addHomepageSectionAction(type), {
                      onSuccess: (data) => data && setEditingId(data.id),
                    })
                  }
                >
                  <span className="font-medium">{HOMEPAGE_SECTION_META[type].label}</span>
                  <span className="text-xs text-muted-foreground">{HOMEPAGE_SECTION_META[type].description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border bg-background">
        {order.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No sections yet. Start with a Hero, then add featured projects and categories.
          </p>
        ) : (
          <SortableList
            as="ol"
            items={order}
            onReorder={reorder}
            getLabel={(section) => HOMEPAGE_SECTION_META[section.type]?.label ?? section.type}
            disabled={pending}
            className="divide-y"
            renderItem={(section, handle, i) => (
              <div className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
                {handle}
                <span className="w-6 text-center text-xs tabular-nums text-muted-foreground">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{HOMEPAGE_SECTION_META[section.type]?.label ?? section.type}</span>
                    {!section.isEnabled && <Badge variant="secondary">Hidden</Badge>}
                    {section.draft && <Badge variant="outline">Unpublished changes</Badge>}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{summary(section)}</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={section.isEnabled}
                    disabled={pending}
                    onCheckedChange={(v) => run(() => setHomepageSectionEnabledAction(section.id, v))}
                    aria-label="Show section on the homepage"
                  />
                  Live
                </label>
                <Button size="icon-sm" variant="ghost" onClick={() => setEditingId(section.id)} aria-label="Edit section">
                  <Pencil />
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => setToDelete(section)} aria-label="Delete section">
                  <Trash2 />
                </Button>
              </div>
            )}
          />
        )}
      </div>

      {editing && (
        <SectionSheet key={`${editing.id}-${editing.updatedAt}-${editing.draft?.updatedAt ?? ""}`} section={editing} onOpenChange={(o) => !o && setEditingId(null)} />
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this section?</AlertDialogTitle>
            <AlertDialogDescription>
              It is removed from the homepage immediately. Consider hiding it instead if you may need it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (toDelete) run(() => deleteHomepageSectionAction(toDelete.id));
                setToDelete(null);
              }}
            >
              Delete section
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
