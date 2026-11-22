import Link from "next/link";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items, className, tone = "dark" }: { items: Crumb[]; className?: string; tone?: "dark" | "light" }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem]",
          tone === "light" ? "text-white/75" : "text-ink-muted",
        )}
      >
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-2">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className={cn("transition-colors", tone === "light" ? "hover:text-white" : "hover:text-ink")}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn(last && (tone === "light" ? "text-white" : "text-ink"))}>
                  {item.label}
                </span>
              )}
              {!last && <span aria-hidden>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
