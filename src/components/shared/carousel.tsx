"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CarouselProps = {
  children: React.ReactNode[];
  label: string;
  /** Tailwind width classes applied to every slide. */
  slideClassName?: string;
  className?: string;
  /** Rendered on the left of the controls row (e.g. a heading). */
  header?: React.ReactNode;
};

const navButton =
  "grid size-12 place-items-center rounded-full border border-ink/20 transition-colors hover:border-ink hover:bg-ink hover:text-background aria-disabled:cursor-default aria-disabled:opacity-35 aria-disabled:hover:border-ink/20 aria-disabled:hover:bg-transparent aria-disabled:hover:text-current";

/**
 * Horizontal editorial carousel (Embla). Native-feeling drag/swipe, keyboard
 * buttons, and a progress rail instead of dots.
 */
export function Carousel({ children, label, slideClassName, className, header }: CarouselProps) {
  const [emblaRef, embla] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    skipSnaps: true,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scrollable, setScrollable] = useState(false);

  const update = useCallback(() => {
    if (!embla) return;
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
    setProgress(Math.max(0, Math.min(1, embla.scrollProgress())));
    setScrollable(embla.scrollSnapList().length > 1);
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    // Sync once on mount, then on every Embla event.
    queueMicrotask(update);
    embla.on("select", update).on("scroll", update).on("reInit", update).on("resize", update);
    return () => {
      embla.off("select", update).off("scroll", update).off("reInit", update).off("resize", update);
    };
  }, [embla, update]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      // --edge = the left/right inset of `container-site`, so the track's first
      // and last slide line up with the rest of the page on viewports wider
      // than --site-max. 100cqw (not 100vw) avoids the scrollbar width.
      className={cn(
        "@container relative [--edge:max(var(--gutter),calc((100cqw-var(--site-max))/2+var(--gutter)))]",
        className,
      )}
    >
      <div className="container-site mb-8 flex items-end justify-between gap-6 md:mb-10">
        <div className="min-w-0 flex-1">{header}</div>
        <div className={cn("hidden shrink-0 gap-2 md:flex", !scrollable && "md:hidden")}>
          {/* aria-disabled rather than `disabled`: Firefox restores a button's
              previous disabled state on reload before hydration, which caused
              a hydration mismatch. Scrolling past either end is a no-op anyway. */}
          <button
            type="button"
            onClick={() => canPrev && embla?.scrollPrev()}
            aria-disabled={!canPrev}
            aria-label="Previous slides"
            className={navButton}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => canNext && embla?.scrollNext()}
            aria-disabled={!canNext}
            aria-label="Next slides"
            className={navButton}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="overflow-hidden pl-(--edge)" ref={emblaRef}>
        <div className="flex touch-pan-y gap-3 pr-(--edge) md:gap-4">
          {children.map((child, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${children.length}`}
              className={cn("min-w-0 shrink-0 grow-0", slideClassName ?? "basis-[82%] sm:basis-[46%] lg:basis-[31%]")}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {scrollable && (
        <div className="container-site mt-8">
          <div className="h-px w-full bg-line" aria-hidden>
            <div
              className="h-px bg-ink transition-[width] duration-300"
              style={{ width: `${Math.max(8, progress * 100)}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
