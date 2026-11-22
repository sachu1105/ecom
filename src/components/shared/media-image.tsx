import Image, { type ImageProps } from "next/image";
import { resolveMediaUrl } from "@/lib/content/media";
import { cn } from "@/lib/utils";

type MediaImageProps = Omit<ImageProps, "src" | "alt"> & {
  path: string | null | undefined;
  alt: string | null | undefined;
  /** Shown when there is no image yet (keeps layouts intact while content is being added). */
  placeholderLabel?: string;
};

/**
 * next/image for stored media references. Falls back to a neutral, on-brand
 * placeholder so a missing image never breaks a layout.
 */
export function MediaImage({
  path,
  alt,
  className,
  placeholderLabel,
  fill,
  quality = 75,
  ...props
}: MediaImageProps) {
  const src = resolveMediaUrl(path);

  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt || placeholderLabel || "Image coming soon"}
        className={cn(
          "flex items-center justify-center bg-surface-muted text-ink-muted",
          fill && "absolute inset-0",
          className,
        )}
      >
        <span className="text-eyebrow opacity-60">{placeholderLabel ?? ""}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt ?? ""}
      fill={fill}
      quality={quality}
      className={cn("object-cover", className)}
      {...props}
    />
  );
}
