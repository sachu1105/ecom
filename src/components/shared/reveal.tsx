import { cn } from "@/lib/utils";

type RevealProps = React.HTMLAttributes<HTMLDivElement> & {
  /** "view": fade up as the block scrolls into view. "load": fade up on page load (above the fold). */
  mode?: "view" | "load";
  /** Stagger for load animations, in seconds. */
  delay?: number;
};

/**
 * Pure-CSS entrance animation (see `.reveal` in globals.css).
 *
 * Content is visible by default: the animation is only applied where the
 * browser supports scroll-driven animations and the visitor has not asked for
 * reduced motion. No JavaScript is involved, so text is never left hidden by
 * a hydration mismatch or a failed script, and it counts towards LCP at once.
 */
export function Reveal({ mode = "view", delay = 0, className, style, ...props }: RevealProps) {
  return (
    <div
      className={cn(mode === "load" ? "reveal-load" : "reveal", className)}
      style={mode === "load" && delay ? { ...style, animationDelay: `${delay}s` } : style}
      {...props}
    />
  );
}
