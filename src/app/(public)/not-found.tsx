import { CtaLink } from "@/components/shared/cta-link";

export default function NotFound() {
  return (
    <section className="container-site section-y min-h-[60vh]">
      <p className="text-eyebrow text-brand-ink">404</p>
      <h1 className="text-display mt-5 max-w-4xl text-balance">This page has moved or no longer exists</h1>
      <p className="text-lead mt-6 max-w-xl text-ink-muted">
        The project or page you were looking for may have been renamed or unpublished.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <CtaLink href="/projects" variant="solid">
          Browse projects
        </CtaLink>
        <CtaLink href="/" variant="outline">
          Back to home
        </CtaLink>
      </div>
    </section>
  );
}
