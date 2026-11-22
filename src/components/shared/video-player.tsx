"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { resolveMediaUrl } from "@/lib/content/media";
import { cn } from "@/lib/utils";

type VideoPlayerProps = {
  src: string | null | undefined;
  poster?: string | null;
  /** Ambient mode: muted, looping, autoplaying background video. */
  ambient?: boolean;
  className?: string;
  label?: string;
  controlsClassName?: string;
};

/**
 * Ambient videos autoplay muted and looped, but:
 *   - never autoplay when the visitor prefers reduced motion
 *   - always expose a pause control (WCAG 2.2.2)
 *   - pause while off-screen to save battery and bandwidth
 * Non-ambient videos use native controls.
 */
export function VideoPlayer({ src, poster, ambient = false, className, label, controlsClassName }: VideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const videoUrl = resolveMediaUrl(src);
  const posterUrl = resolveMediaUrl(poster) ?? undefined;

  useEffect(() => {
    const video = ref.current;
    if (!ambient || !video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => setPlaying(false));
        } else {
          video.pause();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [ambient, videoUrl]);

  if (!videoUrl) return null;

  if (!ambient) {
    return (
      <video
        ref={ref}
        className={cn("h-full w-full bg-black object-cover", className)}
        src={videoUrl}
        poster={posterUrl}
        controls
        playsInline
        preload="metadata"
        aria-label={label}
      />
    );
  }

  return (
    <>
      <video
        ref={ref}
        className={cn("h-full w-full object-cover", className)}
        src={videoUrl}
        poster={posterUrl}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={() => {
          const v = ref.current;
          if (!v) return;
          if (v.paused) v.play().catch(() => undefined);
          else v.pause();
        }}
        className={cn(
          "absolute bottom-5 right-5 z-20 grid size-11 place-items-center rounded-full bg-black/45 text-white backdrop-blur-md transition hover:bg-black/65 md:bottom-8 md:right-8",
          controlsClassName,
        )}
        aria-label={playing ? "Pause background video" : "Play background video"}
      >
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
      </button>
    </>
  );
}
