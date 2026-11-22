"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Check, Film, Loader2, Search, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listMediaAction, type MediaListItem } from "@/lib/actions/media";
import { useMediaUpload } from "./use-media-upload";
import { IMAGE_MIME_TYPES, VIDEO_MIME_TYPES } from "@/config/media";
import { cn } from "@/lib/utils";

type MediaPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accept: "image" | "video";
  multiple?: boolean;
  onSelect: (items: MediaListItem[]) => void;
};

/** Pick existing media from the library, or upload new files in place. */
export function MediaPicker({ open, onOpenChange, accept, multiple = false, onSelect }: MediaPickerProps) {
  const [items, setItems] = useState<MediaListItem[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, startLoading] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const { upload, uploading } = useMediaUpload();

  const load = useCallback(
    (q: string) =>
      startLoading(async () => {
        const res = await listMediaAction({ q, type: accept });
        if (res.ok) setItems(res.data ?? []);
        else toast.error(res.error);
      }),
    [accept],
  );

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => load(query), query ? 250 : 0);
    return () => clearTimeout(timer);
  }, [open, query, load]);

  const toggle = (id: string) =>
    setSelected((current) =>
      multiple ? (current.includes(id) ? current.filter((x) => x !== id) : [...current, id]) : [id],
    );

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const { uploaded, errors } = await upload(Array.from(files));
    errors.forEach((e) => toast.error(e));
    if (uploaded.length) {
      toast.success(`${uploaded.length} file${uploaded.length > 1 ? "s" : ""} uploaded`);
      setItems((current) => [...uploaded, ...current]);
      setSelected((current) => (multiple ? [...uploaded.map((u) => u.id), ...current] : [uploaded[0].id]));
    }
  };

  const confirm = () => {
    const chosen = selected.map((id) => items.find((i) => i.id === id)).filter(Boolean) as MediaListItem[];
    onSelect(chosen);
    setSelected([]);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setSelected([]);
        onOpenChange(o);
      }}
    >
      <DialogContent className="flex max-h-[90svh] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{accept === "video" ? "Choose a video" : multiple ? "Choose images" : "Choose an image"}</DialogTitle>
          <DialogDescription>Select from the media library or upload new files.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by file name or alt text"
              className="pl-8"
              aria-label="Search media"
            />
          </div>
          <input
            ref={fileInput}
            type="file"
            hidden
            multiple={multiple}
            accept={(accept === "video" ? VIDEO_MIME_TYPES : IMAGE_MIME_TYPES).join(",")}
            onChange={(e) => {
              void onFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>

        <div className="-mx-1 min-h-64 flex-1 overflow-y-auto px-1">
          {loading && items.length === 0 ? (
            <div className="grid h-64 place-items-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="grid h-64 place-items-center text-center text-sm text-muted-foreground">
              No media yet. Upload your first {accept}.
            </div>
          ) : (
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {items.map((item) => {
                const isSelected = selected.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      onDoubleClick={() => {
                        if (!multiple) {
                          onSelect([item]);
                          onOpenChange(false);
                        }
                      }}
                      aria-pressed={isSelected}
                      className={cn(
                        "group relative block aspect-square w-full overflow-hidden rounded-md bg-muted ring-offset-2 transition",
                        isSelected ? "ring-2 ring-primary" : "hover:opacity-90",
                      )}
                    >
                      {item.media_type === "image" && item.url ? (
                        <Image src={item.url} alt={item.alt_text ?? ""} fill sizes="160px" className="object-cover" />
                      ) : (
                        <span className="grid h-full place-items-center text-muted-foreground">
                          <Film className="size-6" />
                        </span>
                      )}
                      <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-1 text-left text-[10px] text-white">
                        {item.file_name}
                      </span>
                      {isSelected && (
                        <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={confirm} disabled={selected.length === 0}>
            {multiple && selected.length > 1 ? `Add ${selected.length} items` : "Use selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
