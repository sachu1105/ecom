"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Copy, Film, Loader2, Search, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAction } from "@/components/admin/use-action";
import { useMediaUpload } from "@/components/media/use-media-upload";
import { deleteMediaAction, listMediaAction, updateMediaAltAction, type MediaListItem } from "@/lib/actions/media";
import { ALLOWED_MIME_TYPES, formatBytes } from "@/config/media";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

export function MediaLibrary({ initial }: { initial: MediaListItem[] }) {
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | "image" | "video">("all");
  const [usage, setUsage] = useState<"all" | "unused">("all");
  const [selected, setSelected] = useState<MediaListItem | null>(null);
  const [alt, setAlt] = useState("");
  const [loading, startLoading] = useTransition();
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { upload, uploading, pending: uploadCount } = useMediaUpload();
  const { run, pending } = useAction();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const timer = setTimeout(
      () =>
        startLoading(async () => {
          const res = await listMediaAction({ q, type });
          if (res.ok) setItems(res.data ?? []);
          else toast.error(res.error);
        }),
      250,
    );
    return () => clearTimeout(timer);
  }, [q, type]);

  const onFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    const { uploaded, errors } = await upload(Array.from(files));
    errors.forEach((e) => toast.error(e));
    if (uploaded.length) {
      toast.success(`${uploaded.length} file${uploaded.length > 1 ? "s" : ""} uploaded`);
      setItems((current) => [...uploaded, ...current]);
    }
  };

  const shown = usage === "unused" ? items.filter((i) => i.usedIn.length === 0) : items;
  const unusedCount = items.filter((i) => i.usedIn.length === 0).length;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void onFiles(e.dataTransfer.files);
      }}
      className={cn("rounded-lg border bg-background transition", dragging && "ring-2 ring-primary")}
    >
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row">
          <div className="relative sm:w-72">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search file name or alt text" className="pl-8" aria-label="Search media" />
          </div>
          <div className="flex gap-1 rounded-md bg-muted p-1 text-sm" role="group" aria-label="Filter by type">
            {(["all", "image", "video"] as const).map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={type === t}
                onClick={() => setType(t)}
                className={cn("rounded px-3 py-1 capitalize", type === t ? "bg-background shadow-sm" : "text-muted-foreground")}
              >
                {t === "all" ? "All" : `${t}s`}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-md bg-muted p-1 text-sm" role="group" aria-label="Filter by usage">
            <button type="button" aria-pressed={usage === "all"} onClick={() => setUsage("all")} className={cn("rounded px-3 py-1", usage === "all" ? "bg-background shadow-sm" : "text-muted-foreground")}>
              Any
            </button>
            <button type="button" aria-pressed={usage === "unused"} onClick={() => setUsage("unused")} className={cn("rounded px-3 py-1", usage === "unused" ? "bg-background shadow-sm" : "text-muted-foreground")}>
              Unused ({unusedCount})
            </button>
          </div>
        </div>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          accept={ALLOWED_MIME_TYPES.join(",")}
          onChange={(e) => {
            void onFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button onClick={() => input.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
          {uploading ? `Uploading ${uploadCount}…` : "Upload"}
        </Button>
      </div>

      <div className="p-4">
        <p className="mb-4 text-xs text-muted-foreground">
          Drag and drop files here. Images up to 15 MB (JPG, PNG, WebP, AVIF, GIF), videos up to 50 MB (MP4, WebM, MOV).
        </p>
        {loading && items.length === 0 ? (
          <div className="grid h-48 place-items-center">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : shown.length === 0 ? (
          <p className="rounded-md border border-dashed p-12 text-center text-sm text-muted-foreground">No media found.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {shown.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(item);
                    setAlt(item.alt_text ?? "");
                  }}
                  className="group block w-full text-left"
                >
                  <span className="relative block aspect-square overflow-hidden rounded-md bg-muted">
                    {item.media_type === "image" && item.url ? (
                      <Image src={item.url} alt={item.alt_text ?? ""} fill sizes="200px" className="object-cover transition group-hover:scale-105" />
                    ) : (
                      <span className="grid h-full place-items-center text-muted-foreground">
                        <Film className="size-7" />
                      </span>
                    )}
                    {item.usedIn.length === 0 && (
                      <Badge variant="secondary" className="absolute left-1.5 top-1.5">
                        Unused
                      </Badge>
                    )}
                    {!item.alt_text && item.media_type === "image" && (
                      <Badge variant="outline" className="absolute bottom-1.5 left-1.5 bg-background/90">
                        No alt
                      </Badge>
                    )}
                  </span>
                  <span className="mt-1.5 block truncate text-xs">{item.file_name}</span>
                  <span className="block text-[11px] text-muted-foreground">{formatBytes(item.size_bytes)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="truncate pr-6">{selected.file_name}</SheetTitle>
                <SheetDescription>Uploaded {formatDateTime(selected.created_at)}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-6">
                <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-muted">
                  {selected.media_type === "image" && selected.url ? (
                    <Image src={selected.url} alt={selected.alt_text ?? ""} fill sizes="400px" className="object-contain" />
                  ) : selected.url ? (
                    <video src={selected.url} controls className="h-full w-full" preload="metadata" />
                  ) : null}
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Type</dt>
                    <dd>{selected.mime_type}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Size</dt>
                    <dd>{formatBytes(selected.size_bytes)}</dd>
                  </div>
                  {selected.width && selected.height && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Dimensions</dt>
                      <dd>
                        {selected.width} × {selected.height}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs text-muted-foreground">Used in</dt>
                    <dd>{selected.usedIn.length ? selected.usedIn.length : "Not used"}</dd>
                  </div>
                </dl>
                {selected.usedIn.length > 0 && (
                  <ul className="space-y-1 rounded-md bg-muted p-3 text-xs">
                    {selected.usedIn.map((u) => (
                      <li key={u}>{u}</li>
                    ))}
                  </ul>
                )}
                <div className="space-y-2">
                  <Label htmlFor="media-alt">Alt text</Label>
                  <Input id="media-alt" value={alt} maxLength={300} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image for screen readers" />
                  <p className="text-xs text-muted-foreground">Used as the default when this file is picked for new content.</p>
                  <Button
                    size="sm"
                    disabled={pending || alt === (selected.alt_text ?? "")}
                    onClick={() =>
                      run(() => updateMediaAltAction({ id: selected.id, alt }), {
                        refresh: false,
                        onSuccess: () => {
                          setItems((list) => list.map((i) => (i.id === selected.id ? { ...i, alt_text: alt } : i)));
                          setSelected({ ...selected, alt_text: alt });
                        },
                      })
                    }
                  >
                    Save alt text
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 border-t pt-4">
                  {selected.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void navigator.clipboard.writeText(selected.url!);
                        toast.success("URL copied");
                      }}
                    >
                      <Copy /> Copy URL
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={pending || selected.usedIn.length > 0}
                    title={selected.usedIn.length > 0 ? "Remove it from content before deleting" : undefined}
                    onClick={() =>
                      run(() => deleteMediaAction(selected.id), {
                        refresh: false,
                        onSuccess: () => {
                          setItems((list) => list.filter((i) => i.id !== selected.id));
                          setSelected(null);
                        },
                      })
                    }
                  >
                    <Trash2 /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
