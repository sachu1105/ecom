import { readableForeground, sanitizeHex } from "@/lib/utils/color";

/**
 * Injects the configurable brand accent as CSS variables. The value is
 * validated as a 6-digit hex colour, so nothing else can reach the stylesheet.
 */
export function BrandStyle({ accent }: { accent: string | null | undefined }) {
  const brand = sanitizeHex(accent);
  const foreground = readableForeground(brand);
  return <style>{`:root{--brand:${brand};--brand-foreground:${foreground};}`}</style>;
}
