"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel } from "@/components/admin/ui";
import { MediaField } from "@/components/admin/fields/field-editor";
import { createProjectAction, updateProjectAction } from "@/lib/actions/projects";
import { projectFormSchema, type ProjectFormInput } from "@/lib/validations/project";
import { slugify } from "@/lib/utils/format";
import type { ProjectRow } from "@/types/database";

const NONE = "__none__";

function Field({
  label,
  htmlFor,
  error,
  help,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {help && !error && <p className="text-xs text-muted-foreground">{help}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function ProjectDetailsForm({
  project,
  categories,
}: {
  project: ProjectRow | null;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(!!project);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProjectFormInput>({
    // The schema's input type is `unknown` for preprocessed fields; the form edits the concrete shape.
    resolver: zodResolver(projectFormSchema) as unknown as Resolver<ProjectFormInput>,
    defaultValues: {
      title: project?.title ?? "",
      slug: project?.slug ?? "",
      short_description: project?.short_description ?? "",
      description: project?.description ?? "",
      category_id: project?.category_id ?? null,
      location: project?.location ?? "",
      completion_date: project?.completion_date ?? "",
      application_type: project?.application_type ?? "",
      material_used: project?.material_used ?? "",
      cover_image_path: project?.cover_image_path ?? null,
      cover_image_alt: project?.cover_image_alt ?? "",
      status: project?.status ?? "draft",
      is_featured: project?.is_featured ?? false,
      seo_title: project?.seo_title ?? "",
      seo_description: project?.seo_description ?? "",
    },
  });

  const save = (values: ProjectFormInput) =>
    startTransition(async () => {
      const result = project
        ? await updateProjectAction(project.id, values)
        : await createProjectAction(values);
      if (!result.ok) {
        for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(name as keyof ProjectFormInput, { message });
        }
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Saved.");
      if (!project && result.data && "id" in result.data) {
        router.push(`/admin/projects/${(result.data as { id: string }).id}/edit?tab=gallery`);
      } else {
        reset(values);
        router.refresh();
      }
    });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(save)(event);
  };

  const err = (name: keyof ProjectFormInput) => errors[name]?.message as string | undefined;

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-3" noValidate>
      <div className="space-y-6 lg:col-span-2">
        <Panel title="Project">
          <div className="space-y-5">
            <Field label="Title *" htmlFor="title" error={err("title")}>
              <Input
                id="title"
                {...register("title", {
                  onChange: (e) => {
                    if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldValidate: false });
                  },
                })}
                aria-invalid={!!errors.title}
              />
            </Field>
            <Field label="URL slug *" htmlFor="slug" error={err("slug")} help="Used in the page address: /projects/your-slug">
              <Input
                id="slug"
                {...register("slug", { onChange: () => setSlugTouched(true) })}
                aria-invalid={!!errors.slug}
                className="font-mono text-sm"
              />
            </Field>
            <Field label="Short description" htmlFor="short_description" error={err("short_description")} help="Shown on cards and in search results (≈ 1–2 sentences).">
              <Textarea id="short_description" rows={2} maxLength={600} {...register("short_description")} />
            </Field>
            <Field label="Full description" htmlFor="description" error={err("description")} help="Project overview. Separate paragraphs with a blank line.">
              <Textarea id="description" rows={8} {...register("description")} />
            </Field>
          </div>
        </Panel>

        <Panel title="Project information" description="Optional. Empty fields are hidden on the website.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Location" htmlFor="location" error={err("location")}>
              <Input id="location" {...register("location")} />
            </Field>
            <Field label="Completion date" htmlFor="completion_date" error={err("completion_date")}>
              <Input id="completion_date" type="date" {...register("completion_date")} />
            </Field>
            <Field label="Application / surface" htmlFor="application_type" error={err("application_type")} help="e.g. Quartz kitchen worktop">
              <Input id="application_type" {...register("application_type")} />
            </Field>
            <Field label="Film / material used" htmlFor="material_used" error={err("material_used")} help="e.g. 8 mil matte clear PPF">
              <Input id="material_used" {...register("material_used")} />
            </Field>
          </div>
        </Panel>

        <Panel title="SEO" description="Optional overrides for search engines and social sharing.">
          <div className="space-y-5">
            <Field label="SEO title" htmlFor="seo_title" error={err("seo_title")}>
              <Input id="seo_title" maxLength={200} {...register("seo_title")} />
            </Field>
            <Field label="SEO description" htmlFor="seo_description" error={err("seo_description")}>
              <Textarea id="seo_description" rows={3} maxLength={320} {...register("seo_description")} />
            </Field>
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Publishing">
          <div className="space-y-5">
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="status">Published</Label>
                    <p className="text-xs text-muted-foreground">Drafts are never visible publicly.</p>
                  </div>
                  <Switch id="status" checked={field.value === "published"} onCheckedChange={(v) => field.onChange(v ? "published" : "draft")} />
                </div>
              )}
            />
            <Controller
              control={control}
              name="is_featured"
              render={({ field }) => (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="is_featured">Featured</Label>
                    <p className="text-xs text-muted-foreground">Shown in featured sections.</p>
                  </div>
                  <Switch id="is_featured" checked={field.value === true} onCheckedChange={field.onChange} />
                </div>
              )}
            />
            <Controller
              control={control}
              name="category_id"
              render={({ field }) => (
                <Field label="Category" htmlFor="category_id" error={err("category_id")}>
                  <Select value={field.value ?? NONE} onValueChange={(v) => field.onChange(v === NONE ? null : v)}>
                    <SelectTrigger id="category_id" className="w-full">
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>No category</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
            <Button type="submit" className="w-full" disabled={pending || (!!project && !isDirty)}>
              {pending && <Loader2 className="animate-spin" />}
              {project ? "Save changes" : "Create project"}
            </Button>
          </div>
        </Panel>

        <Panel title="Cover image">
          <Controller
            control={control}
            name="cover_image_path"
            render={({ field }) => (
              <Controller
                control={control}
                name="cover_image_alt"
                render={({ field: alt }) => (
                  <MediaField
                    label="Cover"
                    accept="image"
                    value={field.value ? { path: field.value, alt: alt.value ?? "" } : null}
                    onChange={(v) => {
                      field.onChange(v?.path ?? null);
                      alt.onChange(v?.alt ?? "");
                    }}
                    help="Landscape, at least 2000px wide. Used as the hero and card image."
                    error={err("cover_image_path")}
                  />
                )}
              />
            )}
          />
        </Panel>
      </div>
    </form>
  );
}
