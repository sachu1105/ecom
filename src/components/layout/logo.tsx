import Image from "next/image";
import { resolveMediaUrl } from "@/lib/content/media";
import type { MediaRef } from "@/lib/validations/common";
import { cn } from "@/lib/utils";

type LogoProps = {
  name: string;
  logo: MediaRef | null;
  className?: string;
  /** Height in px used for the uploaded logo. */
  height?: number;
};

/**
 * Uploaded logo when present, otherwise a typographic wordmark generated from
 * the brand name, so the brand stays fully data-driven.
 */
export function Logo({ name, logo, className, height = 28 }: LogoProps) {
  const src = resolveMediaUrl(logo?.path);
  if (src) {
    return (
      <Image
        src={src}
        alt={logo?.alt || name}
        width={height * 5}
        height={height}
        className={cn("h-(--logo-h) w-auto object-contain", className)}
        style={{ "--logo-h": `${height}px` } as React.CSSProperties}
        loading="eager"
      />
    );
  }
  return (
    <span className={cn("inline-block whitespace-nowrap text-[1.0625rem] font-bold uppercase tracking-[0.14em]", className)}>
      {name}
    </span>
  );
}
