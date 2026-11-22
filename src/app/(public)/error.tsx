"use client";

import { useEffect } from "react";

export default function PublicError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    const digest = error instanceof Error ? (error as Error & { digest?: string }).digest : undefined;
    console.error("Public page error", digest ?? "");
  }, [error]);

  return (
    <section className="container-site section-y min-h-[60vh]">
      <p className="text-eyebrow text-brand-ink">Something went wrong</p>
      <h1 className="text-headline mt-5 max-w-3xl">We couldn&apos;t load this page right now.</h1>
      <p className="mt-4 max-w-xl text-ink-muted">Please try again in a moment.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="btn-pill mt-8 bg-primary text-primary-foreground hover:bg-primary/85"
      >
        Try again
      </button>
    </section>
  );
}
