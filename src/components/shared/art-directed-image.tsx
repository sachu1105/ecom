import { getImageProps } from "next/image";
import { resolveMediaUrl } from "@/lib/content/media";
import type { MediaRef } from "@/lib/validations/common";
import { cn } from "@/lib/utils";

type Props = {
  desktop: MediaRef | null;
  mobile?: MediaRef | null;
  className?: string;
  /** Mark the image as the LCP candidate (hero). */
  eager?: boolean;
  quality?: number;
};

/**
 * Full-bleed image with optional separate mobile crop (`<picture>` art
 * direction via getImageProps), served through the Next.js optimiser.
 */
export function ArtDirectedImage({ desktop, mobile, className, eager = false, quality = 75 }: Props) {
  const desktopSrc = resolveMediaUrl(desktop?.path);
  const mobileSrc = resolveMediaUrl(mobile?.path) ?? desktopSrc;
  if (!desktopSrc || !mobileSrc) return null;

  const common = { alt: desktop?.alt ?? "", sizes: "100vw", fill: true, quality } as const;
  const {
    props: { srcSet: desktopSet },
  } = getImageProps({ ...common, src: desktopSrc });
  const {
    props: { srcSet: mobileSet, ...rest },
  } = getImageProps({
    ...common,
    src: mobileSrc,
    loading: eager ? "eager" : "lazy",
    fetchPriority: eager ? "high" : "auto",
  });

  return (
    <picture>
      <source media="(min-width: 768px)" srcSet={desktopSet} />
      <source media="(max-width: 767px)" srcSet={mobileSet} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is provided through rest props */}
      <img {...rest} className={cn("absolute inset-0 h-full w-full object-cover", className)} />
    </picture>
  );
}
