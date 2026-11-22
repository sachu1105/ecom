"use client";

import { useCallback, useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { MediaImage } from "./media-image";
import type { MediaRef } from "@/lib/validations/common";
import { cn } from "@/lib/utils";

type BeforeAfterProps = {
  before: MediaRef | null;
  after: MediaRef | null;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  sizes?: string;
  aspect?: string;
};

/**
 * Before/after comparison. Drag, tap or use the keyboard (it is a native range
 * input underneath, so it works with screen readers and arrow keys).
 */
export function BeforeAfter({
  before,
  after,
  beforeLabel,
  afterLabel,
  className,
  sizes = "(min-width: 1024px) 80vw, 100vw",
  aspect = "aspect-[4/5] sm:aspect-[16/10]",
}: BeforeAfterProps) {
  const [position, setPosition] = useState(50);
  const frame = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromPointer = useCallback((clientX: number) => {
    const rect = frame.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }, []);

  if (!before || !after) return null;
  const beforeText = beforeLabel || "Before";
  const afterText = afterLabel || "After";

  return (
    <div
      ref={frame}
      className={cn("relative select-none overflow-hidden bg-surface-muted", aspect, className)}
    >
      {/* After (full) */}
      <MediaImage path={after.path} alt={after.alt || afterText} fill sizes={sizes} draggable={false} />
      {/* Before (clipped) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <MediaImage path={before.path} alt={before.alt || beforeText} fill sizes={sizes} draggable={false} />
      </div>

      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-eyebrow text-white backdrop-blur-sm">
        {beforeText}
      </span>
      <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-white/85 px-3 py-1.5 text-eyebrow text-ink backdrop-blur-sm">
        {afterText}
      </span>

      {/* Divider + handle */}
      <div
        className="pointer-events-none absolute inset-y-0 w-px bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
        style={{ left: `${position}%` }}
        aria-hidden
      >
        <div className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-lg">
          <MoveHorizontal className="size-5" />
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(position)}
        onChange={(e) => setPosition(Number(e.target.value))}
        onPointerDown={(e) => {
          dragging.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          setFromPointer(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging.current) setFromPointer(e.clientX);
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        style={{ touchAction: "pan-y" }}
        aria-label={`Reveal ${beforeText.toLowerCase()} and ${afterText.toLowerCase()} images`}
        aria-valuetext={`${Math.round(position)}% ${beforeText}`}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
