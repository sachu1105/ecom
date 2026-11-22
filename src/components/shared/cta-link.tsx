import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { isSafeHref } from "@/lib/validations/common";
import { cn } from "@/lib/utils";

export type CtaVariant = "solid" | "light" | "outline" | "outline-light" | "brand" | "text";

const variants: Record<CtaVariant, string> = {
  solid: "btn-pill bg-primary text-primary-foreground hover:bg-primary/85",
  light: "btn-pill bg-background text-ink hover:bg-background/85",
  outline: "btn-pill border border-ink/25 text-ink hover:border-ink",
  "outline-light": "btn-pill border border-white/50 text-white hover:border-white hover:bg-white/10",
  brand: "btn-pill bg-brand text-brand-foreground hover:opacity-90",
  text: "group inline-flex items-center gap-2 text-[0.9375rem] font-medium decoration-brand underline-offset-[6px] hover:underline",
};

type CtaLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: CtaVariant;
  className?: string;
  arrow?: boolean;
  prefetch?: boolean;
};

/** Internal links use next/link; external links open safely in a new tab. */
export function CtaLink({ href, children, variant = "solid", className, arrow, prefetch }: CtaLinkProps) {
  if (!href || !isSafeHref(href)) return null;
  const classes = cn(variants[variant], className);
  const content = (
    <>
      {children}
      {(arrow || variant === "text") && (
        <ArrowRight
          aria-hidden
          className={cn(
            "size-4 transition-transform duration-300 group-hover:translate-x-0.5",
            variant === "text" && "text-brand",
          )}
        />
      )}
    </>
  );

  const isInternal = href.startsWith("/") || href.startsWith("#");
  if (isInternal) {
    return (
      <Link href={href} className={cn("group", classes)} prefetch={prefetch}>
        {content}
      </Link>
    );
  }
  const external = /^https?:/i.test(href);
  return (
    <a
      href={href}
      className={cn("group", classes)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {content}
    </a>
  );
}
