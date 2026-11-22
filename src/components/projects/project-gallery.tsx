"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { resolveMediaUrl } from "@/lib/content/media";
import { cn } from "@/lib/utils";

export type GalleryItem = { path: string; alt: string; caption?: string | null };

type Props = {
  items: GalleryItem[];
  layout?: "grid" | "carousel" | "masonry";
  title?: string;
};

/**
 * Installation photographs with an accessible lightbox (Radix Dialog: focus
 * trap, Escape to close; arrow keys to navigate).
 */
export function ProjectGallery({ items, layout = "grid", title = "Project gallery" }: Props) {
  const [index, setIndex] = useState<number | null>(null);
  const valid = items.filter((i) => resolveMediaUrl(i.path));
  const count = valid.length;

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i === null ? i : (i + dir + count) % count)),
    [count],
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  if (count === 0) return null;
  const current = index !== null ? valid[index] : null;

  const tile = (item: GalleryItem, i: number, className: string, sizes: string) => (
    <figure key={`${item.path}-${i}`} className={className}>
      <button
        type="button"
        onClick={() => setIndex(i)}
        className="group relative block h-full w-full overflow-hidden bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label={`Open image ${i + 1} of ${count}${item.alt ? `: ${item.alt}` : ""}`}
      >
        <Image
          src={resolveMediaUrl(item.path)!}
          alt={item.alt}
          fill
          sizes={sizes}
          className="object-cover transition-transform duration-[1200ms] ease-(--ease-out) group-hover:scale-[1.03]"
        />
      </button>
      {item.caption && <figcaption className="mt-3 text-sm text-ink-muted">{item.caption}</figcaption>}
    </figure>
  );

  return (
    <>
      {layout === "carousel" ? (
        <div className="scrollbar-none -mx-(--gutter) flex snap-x snap-mandatory gap-3 overflow-x-auto px-(--gutter) md:gap-4">
          {valid.map((item, i) =>
            tile(item, i, "w-[82%] shrink-0 snap-start sm:w-[55%] lg:w-[42%] [&>button]:aspect-[4/3]", "(min-width: 1024px) 42vw, 82vw"),
          )}
        </div>
      ) : layout === "masonry" ? (
        <div className="columns-1 gap-3 sm:columns-2 md:gap-4 lg:columns-3">
          {valid.map((item, i) =>
            tile(
              item,
              i,
              cn("mb-3 break-inside-avoid md:mb-4", i % 3 === 0 ? "[&>button]:aspect-[4/5]" : "[&>button]:aspect-[4/3]"),
              "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
            ),
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-12 md:gap-4">
          {valid.map((item, i) => {
            // Editorial rhythm: a wide image, then pairs.
            const wide = i % 3 === 0;
            return tile(
              item,
              i,
              cn(wide ? "col-span-2 md:col-span-12 [&>button]:aspect-[16/9]" : "col-span-1 md:col-span-6 [&>button]:aspect-[4/5]"),
              wide ? "100vw" : "(min-width: 768px) 50vw, 50vw",
            );
          })}
        </div>
      )}

      <Dialog open={index !== null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent
          showCloseButton={false}
          className="max-w-none! h-svh w-screen translate-x-[-50%] translate-y-[-50%] gap-0 rounded-none border-0 bg-black p-0 text-white sm:max-w-none"
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            Image {index !== null ? index + 1 : 0} of {count}. Use the arrow keys to navigate.
          </DialogDescription>
          {current && (
            <div className="relative flex h-full w-full flex-col">
              <div className="flex items-center justify-between px-5 py-4 text-sm text-white/70">
                <span className="tabular-nums">
                  {(index ?? 0) + 1} / {count}
                </span>
                <button
                  type="button"
                  onClick={() => setIndex(null)}
                  className="grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  aria-label="Close gallery"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="relative flex-1">
                <Image
                  key={current.path}
                  src={resolveMediaUrl(current.path)!}
                  alt={current.alt}
                  fill
                  sizes="100vw"
                  quality={85}
                  className="object-contain"
                />
              </div>
              <div className="flex items-center justify-between gap-4 px-5 py-5">
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="grid size-12 place-items-center rounded-full bg-white/10 hover:bg-white/20"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <p className="line-clamp-2 text-center text-sm text-white/75">{current.caption || current.alt}</p>
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="grid size-12 place-items-center rounded-full bg-white/10 hover:bg-white/20"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
