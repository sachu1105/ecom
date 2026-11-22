"use client";

import { useState } from "react";
import Image from "next/image";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { MediaField } from "@/components/admin/fields/field-editor";
import { useAction } from "@/components/admin/use-action";
import { SortableList } from "@/components/admin/sortable-list";
import {
  deleteCategoryAction,
  reorderCategoriesAction,
  saveCategoryAction,
  setCategoryActiveAction,
} from "@/lib/actions/categories";
import { categoryFormSchema } from "@/lib/validations/forms";
import { resolveMediaUrl } from "@/lib/content/media";
import { slugify } from "@/lib/utils/format";
import type { CategoryRow } from "@/types/database";

type Row = CategoryRow & { project_count: number };
type FormValues = {
  name: string;
  slug: string;
  description: string;
  cover_image_path: string | null;
  is_active: boolean;
};

function CategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category: Row | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { run, pending } = useAction();
  const [slugTouched, setSlugTouched] = useState(!!category);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(categoryFormSchema) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: category?.name ?? "",
      slug: category?.slug ?? "",
      description: category?.description ?? "",
      cover_image_path: category?.cover_image_path ?? null,
      is_active: category?.is_active ?? true,
    },
  });

  const save = (values: FormValues) =>
    run(
      async () => {
        const result = await saveCategoryAction(category?.id ?? null, values);
        if (!result.ok) {
          for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
            setError(name as keyof FormValues, { message });
          }
        }
        return result;
      },
      { onSuccess: () => onOpenChange(false) },
    );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(save)(event);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>Categories group projects by application or film type.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name *</Label>
            <Input
              id="cat-name"
              {...register("name", {
                onChange: (e) => !slugTouched && setValue("slug", slugify(e.target.value)),
              })}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug *</Label>
            <Input
              id="cat-slug"
              className="font-mono text-sm"
              {...register("slug", { onChange: () => setSlugTouched(true) })}
              aria-invalid={!!errors.slug}
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea id="cat-description" rows={3} maxLength={2000} {...register("description")} />
          </div>
          <Controller
            control={control}
            name="cover_image_path"
            render={({ field }) => (
              <MediaField
                label="Cover image"
                accept="image"
                value={field.value ? { path: field.value, alt: "" } : null}
                onChange={(v) => field.onChange(v?.path ?? null)}
              />
            )}
          />
          <Controller
            control={control}
            name="is_active"
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label htmlFor="cat-active">Visible on the website</Label>
                  <p className="text-xs text-muted-foreground">Hidden categories disappear from menus and filters.</p>
                </div>
                <Switch id="cat-active" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {category ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CategoriesManager({ categories }: { categories: Row[] }) {
  const [order, setOrder] = useState(categories);
  const [source, setSource] = useState(categories);
  if (source !== categories) {
    setSource(categories);
    setOrder(categories);
  }
  const [editing, setEditing] = useState<Row | null>(null);
  const [dialogKey, setDialogKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const { run, pending } = useAction();

  const openDialog = (row: Row | null) => {
    setEditing(row);
    setDialogKey((k) => k + 1);
    setDialogOpen(true);
  };

  const reorder = (next: Row[]) => {
    setOrder(next);
    run(() => reorderCategoriesAction(next.map((c) => c.id)), { success: "Order updated.", refresh: false });
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => openDialog(null)}>
          <Plus /> New category
        </Button>
      </div>
      <div className="rounded-lg border bg-background">
        {order.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No categories yet. Create one for each application, e.g. kitchen worktops or cabinetry.
          </p>
        ) : (
          <SortableList
            items={order}
            onReorder={reorder}
            getLabel={(c) => c.name}
            disabled={pending}
            className="divide-y"
            renderItem={(c, handle) => {
              const cover = resolveMediaUrl(c.cover_image_path);
              return (
                <div className="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                  {handle}
                  <div className="relative aspect-[4/3] w-20 shrink-0 overflow-hidden rounded bg-muted">
                    {cover && <Image src={cover} alt="" fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      /{c.slug} · {c.project_count} {c.project_count === 1 ? "project" : "projects"}
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Switch
                      checked={c.is_active}
                      disabled={pending}
                      onCheckedChange={(v) => run(() => setCategoryActiveAction(c.id, v))}
                      aria-label={`Show ${c.name} on the website`}
                    />
                    Visible
                  </label>
                  <Button size="icon-sm" variant="ghost" onClick={() => openDialog(c)} aria-label={`Edit ${c.name}`}>
                    <Pencil />
                  </Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setToDelete(c)} aria-label={`Delete ${c.name}`}>
                    <Trash2 />
                  </Button>
                </div>
              );
            }}
          />
        )}
      </div>

      <CategoryDialog key={dialogKey} category={editing} open={dialogOpen} onOpenChange={setDialogOpen} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{toDelete?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.project_count
                ? `${toDelete.project_count} project(s) will become uncategorised. They are not deleted.`
                : "This category has no projects."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (toDelete) run(() => deleteCategoryAction(toDelete.id));
                setToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
