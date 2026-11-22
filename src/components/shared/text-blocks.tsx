import { paragraphs } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

/**
 * Renders admin-authored plain text as paragraphs. Content is emitted as text
 * nodes (React escapes it), never as HTML, so stored XSS is not possible.
 */
export function Paragraphs({ text, className }: { text: string | null | undefined; className?: string }) {
  const items = paragraphs(text);
  if (items.length === 0) return null;
  return (
    <div className={cn("prose-site", className)}>
      {items.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

export function Eyebrow({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (!children) return null;
  return <p className={cn("text-eyebrow text-brand-ink", className)}>{children}</p>;
}

type SectionHeadingProps = {
  eyebrow?: string;
  heading?: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  action?: React.ReactNode;
};

export function SectionHeading({
  eyebrow,
  heading,
  description,
  className,
  align = "left",
  as: Tag = "h2",
  action,
}: SectionHeadingProps) {
  if (!eyebrow && !heading && !description && !action) return null;
  return (
    <div
      className={cn(
        "flex flex-col gap-6 md:flex-row md:items-end md:justify-between",
        align === "center" && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-3xl space-y-4", align === "center" && "mx-auto")}>
        <Eyebrow>{eyebrow}</Eyebrow>
        {heading && <Tag className="text-headline text-balance">{heading}</Tag>}
        {description && <p className="text-lead text-ink-muted text-pretty">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
