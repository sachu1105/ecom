import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center bg-surface-muted px-6 py-20 text-center md:py-28", className)}>
      <p className="text-title">{title}</p>
      {description && <p className="mt-3 max-w-md text-ink-muted">{description}</p>}
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
