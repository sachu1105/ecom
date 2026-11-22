import { cn } from "@/lib/utils";

function Block({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-surface-muted", className)} />;
}

export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden>
      <div className="border-b border-line">
        <div className="container-site flex gap-2 py-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Block key={i} className="h-10 w-28 rounded-full" />
          ))}
        </div>
      </div>
      <div className="container-site grid gap-x-4 gap-y-12 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Block className="aspect-[4/5] w-full" />
            <Block className="h-5 w-2/3" />
            <Block className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div aria-hidden>
      <Block className="h-[80svh] w-full" />
      <div className="container-site grid gap-6 py-16 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Block key={i} className="h-14" />
        ))}
      </div>
      <div className="container-site space-y-4 pb-24">
        <Block className="h-6 w-1/2" />
        <Block className="h-4 w-full" />
        <Block className="h-4 w-5/6" />
      </div>
    </div>
  );
}
