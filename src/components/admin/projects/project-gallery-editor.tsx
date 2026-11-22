"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/admin/ui";
import { MediaPicker } from "@/components/media/media-picker";
import { useAction } from "@/components/admin/use-action";
import { saveProjectMediaAction } from "@/lib/actions/projects";
import { resolveMediaUrl } from "@/lib/content/media";
import type { ProjectMediaItem } from "@/lib/validations/project";
import type { ProjectMediaRow } from "@/types/database";

/** Manages the project's installation photographs (project_media). */
export function ProjectGalleryEditor({ projectId, media }: { projectId: string; media: ProjectMediaRow[] }) {
  const [items, setItems] = useState<ProjectMediaItem[]>(
    media.map((m) => ({
      id: m.id,
      media_type: m.media_type,
      storage_path: m.storage_path,
      alt_text: m.alt_text ?? "",
      caption: m.caption ?? "",
    })),
  );
  const [dirty, setDirty] = useState(false);
  const [picking, setPicking] = useState(false);
  const { run, pending } = useAction();

  const update = (next: ProjectMediaItem[]) => {
    setItems(next);
    setDirty(true);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    update(next);
  };

  return (
    <Panel
      title="Installation photographs"
      description="Shown as the project's main gallery. Drag order with the arrows."
      actions={
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setPicking(true)}>
            <ImagePlus /> Add photos
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!dirty || pending}
            onClick={() => run(() => saveProjectMediaAction(projectId, items), { onSuccess: () => setDirty(false) })}
          >
            {pending && <Loader2 className="animate-spin" />}
            Save gallery
          </Button>
        </div>
      }
    >
      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="flex w-full flex-col items-center gap-2 rounded-md border border-dashed p-10 text-sm text-muted-foreground hover:border-foreground/40"
        >
          <ImagePlus className="size-6" />
          Add installation photographs
        </button>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, i) => {
            const url = resolveMediaUrl(item.storage_path);
            return (
              <li key={`${item.storage_path}-${i}`} className="overflow-hidden rounded-md border">
                <div className="relative aspect-[4/3] bg-muted">
                  {url && <Image src={url} alt={item.alt_text} fill sizes="320px" className="object-cover" />}
                  <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">{i + 1}</span>
                </div>
                <div className="space-y-2 p-2">
                  <Input
                    value={item.alt_text}
                    onChange={(e) => update(items.map((x, k) => (k === i ? { ...x, alt_text: e.target.value } : x)))}
                    placeholder="Alt text"
                    aria-label={`Photo ${i + 1} alt text`}
                    maxLength={300}
                  />
                  <Input
                    value={item.caption}
                    onChange={(e) => update(items.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)))}
                    placeholder="Caption (optional)"
                    aria-label={`Photo ${i + 1} caption`}
                    maxLength={500}
                  />
                  <div className="flex justify-end gap-1">
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier">
                      <ArrowUp />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move later">
                      <ArrowDown />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" onClick={() => update(items.filter((_, k) => k !== i))} aria-label="Remove photo">
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <MediaPicker
        open={picking}
        onOpenChange={setPicking}
        accept="image"
        multiple
        onSelect={(chosen) =>
          update([
            ...items,
            ...chosen.map((m) => ({
              media_type: "image" as const,
              storage_path: m.storage_path,
              alt_text: m.alt_text ?? "",
              caption: "",
            })),
          ])
        }
      />
    </Panel>
  );
}
