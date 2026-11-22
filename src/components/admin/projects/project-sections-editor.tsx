"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Panel } from "@/components/admin/ui";
import { FieldEditor } from "@/components/admin/fields/field-editor";
import { useAction } from "@/components/admin/use-action";
import { PROJECT_SECTION_META } from "@/config/fields";
import { saveProjectSectionsAction } from "@/lib/actions/projects";
import {
  PROJECT_SECTION_TYPES,
  projectSectionContentSchemas,
  type ProjectSectionType,
} from "@/lib/validations/sections";
import type { ProjectSectionRow } from "@/types/database";
import { cn } from "@/lib/utils";

type Draft = {
  key: string;
  id?: string;
  section_type: ProjectSectionType;
  heading: string;
  content: Record<string, unknown>;
};

let counter = 0;
const newKey = () => `new-${Date.now()}-${counter++}`;

/** Add, edit, reorder and remove flexible case-study sections. */
export function ProjectSectionsEditor({ projectId, sections }: { projectId: string; sections: ProjectSectionRow[] }) {
  const [items, setItems] = useState<Draft[]>(
    sections
      .filter((s) => (PROJECT_SECTION_TYPES as readonly string[]).includes(s.section_type))
      .map((s) => ({
        key: s.id,
        id: s.id,
        section_type: s.section_type as ProjectSectionType,
        heading: s.heading ?? "",
        content: (s.content as Record<string, unknown>) ?? {},
      })),
  );
  const [open, setOpen] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { run, pending } = useAction();

  const update = (next: Draft[]) => {
    setItems(next);
    setDirty(true);
  };

  const add = (type: ProjectSectionType) => {
    const key = newKey();
    const content = projectSectionContentSchemas[type].parse({}) as Record<string, unknown>;
    update([...items, { key, section_type: type, heading: "", content }]);
    setOpen(key);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  const save = () =>
    run(
      async () => {
        const result = await saveProjectSectionsAction(
          projectId,
          items.map(({ id, section_type, heading, content }) => ({ id, section_type, heading, content })),
        );
        setErrors(result.ok ? {} : (result.fieldErrors ?? {}));
        return result;
      },
      { onSuccess: () => setDirty(false) },
    );

  return (
    <Panel
      title="Case-study sections"
      description="Flexible content shown after the overview and gallery."
      actions={
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Plus /> Add section
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {PROJECT_SECTION_TYPES.map((type) => (
                <DropdownMenuItem key={type} onSelect={() => add(type)} className="flex-col items-start gap-0.5">
                  <span className="font-medium">{PROJECT_SECTION_META[type].label}</span>
                  <span className="text-xs text-muted-foreground">{PROJECT_SECTION_META[type].description}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" size="sm" onClick={save} disabled={!dirty || pending}>
            {pending && <Loader2 className="animate-spin" />}
            Save sections
          </Button>
        </div>
      }
    >
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
          No sections yet. Add text, galleries, before-and-after comparisons, videos, specifications or a client quote.
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, i) => {
            const meta = PROJECT_SECTION_META[item.section_type];
            const isOpen = open === item.key;
            const error = errors[`sections.${i}`];
            return (
              <li key={item.key} className={cn("rounded-md border", error && "border-destructive")}>
                <div className="flex items-center gap-2 p-3">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : item.key)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    aria-expanded={isOpen}
                  >
                    <ChevronDown className={cn("size-4 shrink-0 transition-transform", isOpen && "rotate-180")} />
                    <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">{meta.label}</span>
                    <span className="truncate text-sm">{item.heading || <span className="text-muted-foreground">Untitled</span>}</span>
                  </button>
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move section up">
                    <ArrowUp />
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move section down">
                    <ArrowDown />
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => update(items.filter((_, k) => k !== i))} aria-label="Remove section">
                    <Trash2 />
                  </Button>
                </div>
                {error && <p className="px-3 pb-2 text-xs text-destructive">{error}</p>}
                {isOpen && (
                  <div className="space-y-6 border-t p-4">
                    <div className="space-y-2">
                      <Label htmlFor={`${item.key}-heading`}>Heading (optional)</Label>
                      <Input
                        id={`${item.key}-heading`}
                        value={item.heading}
                        maxLength={200}
                        onChange={(e) => update(items.map((x, k) => (k === i ? { ...x, heading: e.target.value } : x)))}
                      />
                    </div>
                    <FieldEditor
                      fields={meta.fields}
                      value={item.content}
                      onChange={(content) => update(items.map((x, k) => (k === i ? { ...x, content } : x)))}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
