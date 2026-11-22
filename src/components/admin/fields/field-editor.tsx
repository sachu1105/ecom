"use client";

import { useId, useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Film, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaPicker } from "@/components/media/media-picker";
import { resolveMediaUrl } from "@/lib/content/media";
import type { FieldDef } from "@/config/fields";
import { cn } from "@/lib/utils";

type Value = Record<string, unknown>;
type MediaValue = { path: string; alt: string; caption?: string } | null;

type FieldEditorProps = {
  fields: FieldDef[];
  value: Value;
  onChange: (next: Value) => void;
  /** Server-side errors keyed by dotted path. */
  errors?: Record<string, string>;
  pathPrefix?: string;
};

function Help({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="text-xs text-muted-foreground">{children}</p>;
}

function ErrorText({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function MediaThumb({ media, accept }: { media: MediaValue; accept: "image" | "video" }) {
  const url = resolveMediaUrl(media?.path);
  if (!url) return null;
  if (accept === "video") {
    return (
      <span className="grid h-full w-full place-items-center bg-muted text-muted-foreground">
        <Film className="size-6" />
      </span>
    );
  }
  return <Image src={url} alt={media?.alt ?? ""} fill sizes="200px" className="object-cover" />;
}

export function MediaField({
  label,
  accept,
  value,
  onChange,
  help,
  error,
}: {
  label: string;
  accept: "image" | "video";
  value: MediaValue;
  onChange: (v: MediaValue) => void;
  help?: string;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-3">
        <button
          id={id}
          type="button"
          onClick={() => setOpen(true)}
          className="relative grid aspect-[4/3] w-36 shrink-0 place-items-center overflow-hidden rounded-md border border-dashed bg-muted/50 text-muted-foreground transition hover:border-foreground/40"
          aria-label={value ? `Change ${label}` : `Choose ${label}`}
        >
          {value?.path ? <MediaThumb media={value} accept={accept} /> : accept === "video" ? <Film className="size-6" /> : <ImagePlus className="size-6" />}
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          {value?.path ? (
            <>
              <Input
                value={value.alt ?? ""}
                onChange={(e) => onChange({ ...value, alt: e.target.value })}
                placeholder={accept === "video" ? "Description (optional)" : "Alt text: describe the image"}
                aria-label={`${label} alt text`}
                maxLength={300}
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
                  Replace
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
                  <X /> Remove
                </Button>
              </div>
            </>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
              Choose {accept}
            </Button>
          )}
          <Help>{help}</Help>
          <ErrorText message={error} />
        </div>
      </div>
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        accept={accept}
        onSelect={([item]) => item && onChange({ path: item.storage_path, alt: item.alt_text ?? value?.alt ?? "" })}
      />
    </div>
  );
}

function MediaListField({
  label,
  value,
  onChange,
  withCaption,
  help,
}: {
  label: string;
  value: MediaValue[];
  onChange: (v: MediaValue[]) => void;
  withCaption?: boolean;
  help?: string;
}) {
  const [open, setOpen] = useState(false);
  const list = (value ?? []).filter(Boolean) as NonNullable<MediaValue>[];
  const move = (i: number, dir: -1 | 1) => {
    const next = [...list];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus /> Add images
        </Button>
      </div>
      <Help>{help}</Help>
      {list.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">No images yet.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((item, i) => (
            <li key={`${item.path}-${i}`} className="flex gap-3 rounded-md border p-2">
              <span className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded bg-muted">
                <MediaThumb media={item} accept="image" />
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  value={item.alt ?? ""}
                  onChange={(e) => onChange(list.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))}
                  placeholder="Alt text"
                  aria-label={`Image ${i + 1} alt text`}
                  maxLength={300}
                />
                {withCaption && (
                  <Input
                    value={item.caption ?? ""}
                    onChange={(e) => onChange(list.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)))}
                    placeholder="Caption (optional)"
                    aria-label={`Image ${i + 1} caption`}
                    maxLength={300}
                  />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button type="button" size="icon-sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                  <ArrowUp />
                </Button>
                <Button type="button" size="icon-sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Move down">
                  <ArrowDown />
                </Button>
                <Button type="button" size="icon-sm" variant="ghost" onClick={() => onChange(list.filter((_, k) => k !== i))} aria-label="Remove image">
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <MediaPicker
        open={open}
        onOpenChange={setOpen}
        accept="image"
        multiple
        onSelect={(items) =>
          onChange([
            ...list,
            ...items.map((m) => ({ path: m.storage_path, alt: m.alt_text ?? "", ...(withCaption ? { caption: "" } : {}) })),
          ])
        }
      />
    </div>
  );
}

/**
 * Renders form controls from field descriptors (src/config/fields.ts) for a
 * JSONB value. Validation happens on the server with the matching Zod schema.
 */
export function FieldEditor({ fields, value, onChange, errors = {}, pathPrefix = "" }: FieldEditorProps) {
  const baseId = useId();
  const set = (name: string, v: unknown) => onChange({ ...value, [name]: v });

  return (
    <div className="space-y-6">
      {fields.map((field) => {
        const id = `${baseId}-${field.name}`;
        const path = pathPrefix ? `${pathPrefix}.${field.name}` : field.name;
        const error = errors[path];
        const current = value?.[field.name];

        switch (field.kind) {
          case "text":
            return (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <Input
                  id={id}
                  value={(current as string) ?? ""}
                  placeholder={field.placeholder}
                  maxLength={field.max ?? 500}
                  aria-invalid={!!error}
                  onChange={(e) => set(field.name, e.target.value)}
                />
                <Help>{field.help}</Help>
                <ErrorText message={error} />
              </div>
            );
          case "textarea":
            return (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <Textarea
                  id={id}
                  rows={field.rows ?? 4}
                  value={(current as string) ?? ""}
                  maxLength={field.max ?? 20000}
                  aria-invalid={!!error}
                  onChange={(e) => set(field.name, e.target.value)}
                />
                <Help>{field.help}</Help>
                <ErrorText message={error} />
              </div>
            );
          case "number":
            return (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <Input
                  id={id}
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step ?? 1}
                  value={current === undefined || current === null ? "" : String(current)}
                  onChange={(e) => set(field.name, e.target.value === "" ? undefined : Number(e.target.value))}
                  className="max-w-40"
                />
                <Help>{field.help}</Help>
                <ErrorText message={error} />
              </div>
            );
          case "switch":
            return (
              <div key={field.name} className="flex items-start justify-between gap-6 rounded-md border p-3">
                <div className="space-y-1">
                  <Label htmlFor={id}>{field.label}</Label>
                  <Help>{field.help}</Help>
                </div>
                <Switch id={id} checked={current === true} onCheckedChange={(v) => set(field.name, v)} />
              </div>
            );
          case "select":
            return (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <Select value={(current as string) || field.options[0]?.value} onValueChange={(v) => set(field.name, v)}>
                  <SelectTrigger id={id} className="w-full sm:w-72">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Help>{field.help}</Help>
                <ErrorText message={error} />
              </div>
            );
          case "color": {
            const hex = typeof current === "string" ? current : "#A47B4F";
            return (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={id}>{field.label}</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={/^#[0-9a-f]{6}$/i.test(hex) ? hex : "#A47B4F"}
                    onChange={(e) => set(field.name, e.target.value.toUpperCase())}
                    className="h-9 w-12 cursor-pointer rounded border bg-transparent p-1"
                    aria-label={`${field.label} picker`}
                  />
                  <Input id={id} value={hex} onChange={(e) => set(field.name, e.target.value)} className="w-32 font-mono" maxLength={7} />
                </div>
                <Help>{field.help}</Help>
                <ErrorText message={error} />
              </div>
            );
          }
          case "cta": {
            const cta = (current as { label?: string; href?: string }) ?? {};
            return (
              <fieldset key={field.name} className="space-y-2">
                <legend className="text-sm font-medium">{field.label}</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={cta.label ?? ""}
                    placeholder="Button text"
                    maxLength={60}
                    aria-label={`${field.label} text`}
                    onChange={(e) => set(field.name, { ...cta, label: e.target.value })}
                  />
                  <Input
                    value={cta.href ?? ""}
                    placeholder="/projects"
                    maxLength={500}
                    aria-label={`${field.label} link`}
                    aria-invalid={!!errors[`${path}.href`]}
                    onChange={(e) => set(field.name, { ...cta, href: e.target.value })}
                  />
                </div>
                <Help>{field.help}</Help>
                <ErrorText message={errors[`${path}.href`] ?? error} />
              </fieldset>
            );
          }
          case "media":
            return (
              <MediaField
                key={field.name}
                label={field.label}
                accept={field.accept}
                value={(current as MediaValue) ?? null}
                onChange={(v) => set(field.name, v)}
                help={field.help}
                error={error ?? errors[`${path}.path`]}
              />
            );
          case "mediaList":
            return (
              <MediaListField
                key={field.name}
                label={field.label}
                value={(current as MediaValue[]) ?? []}
                onChange={(v) => set(field.name, v)}
                withCaption={field.withCaption}
                help={field.help}
              />
            );
          case "group":
            return (
              <fieldset key={field.name} className="space-y-5 rounded-lg border p-4 sm:p-5">
                <legend className="px-1 text-sm font-semibold">{field.label}</legend>
                <FieldEditor
                  fields={field.fields}
                  value={(current as Value) ?? {}}
                  onChange={(v) => set(field.name, v)}
                  errors={errors}
                  pathPrefix={path}
                />
              </fieldset>
            );
          case "list": {
            const rows = (Array.isArray(current) ? current : []) as Value[];
            const update = (next: Value[]) => set(field.name, next);
            return (
              <div key={field.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{field.label}</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={field.max !== undefined && rows.length >= field.max}
                    onClick={() => update([...rows, {}])}
                  >
                    <Plus /> Add {field.itemLabel.toLowerCase()}
                  </Button>
                </div>
                <Help>{field.help}</Help>
                {rows.length === 0 && (
                  <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">None yet.</p>
                )}
                <ol className="space-y-3">
                  {rows.map((row, i) => (
                    <li key={i} className={cn("rounded-md border bg-muted/30 p-3")}>
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {field.itemLabel} {i + 1}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            disabled={i === 0}
                            aria-label="Move up"
                            onClick={() => {
                              const next = [...rows];
                              [next[i - 1], next[i]] = [next[i], next[i - 1]];
                              update(next);
                            }}
                          >
                            <ArrowUp />
                          </Button>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            disabled={i === rows.length - 1}
                            aria-label="Move down"
                            onClick={() => {
                              const next = [...rows];
                              [next[i + 1], next[i]] = [next[i], next[i + 1]];
                              update(next);
                            }}
                          >
                            <ArrowDown />
                          </Button>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            aria-label={`Remove ${field.itemLabel.toLowerCase()}`}
                            onClick={() => update(rows.filter((_, k) => k !== i))}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                      <FieldEditor
                        fields={field.fields}
                        value={row}
                        onChange={(v) => update(rows.map((r, k) => (k === i ? v : r)))}
                        errors={errors}
                        pathPrefix={`${path}.${i}`}
                      />
                    </li>
                  ))}
                </ol>
              </div>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}
