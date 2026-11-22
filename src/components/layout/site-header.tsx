"use client";

import { Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = { label: string; href: string };
export type NavCategory = { name: string; slug: string; projectCount: number };

type SiteHeaderProps = {
  logo: React.ReactNode;
  logoInverse: React.ReactNode;
  brandName: string;
  items: NavItem[];
  categories: NavCategory[];
  categoriesLabel: string;
  cta: { label: string; href: string } | null;
  contactLine?: { email?: string; phone?: string };
};

/** Reports pathname changes. Isolated in Suspense so the header stays in the static shell. */
function PathnameListener({ onChange }: { onChange: (path: string) => void }) {
  const pathname = usePathname();
  useEffect(() => onChange(pathname), [pathname, onChange]);
  return null;
}

export function SiteHeader({
  logo,
  logoInverse,
  brandName,
  items,
  categories,
  categoriesLabel,
  cta,
  contactLine,
}: SiteHeaderProps) {
  const [pathname, setPathname] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const lastY = useRef(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const megaId = useId();
  const mobileId = useId();

  const handlePathname = useCallback((path: string) => {
    setPathname(path);
    setMegaOpen(false);
    setMobileOpen(false);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      // Hide on scroll down, reveal on scroll up (editorial header behaviour).
      const delta = y - lastY.current;
      if (y <= 320) setHidden(false);
      else if (delta > 6) setHidden(true);
      else if (delta < -6) setHidden(false);
      if (Math.abs(delta) > 6 || y <= 320) lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hoverOpenedAt = useRef(0);
  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (!megaOpen) hoverOpenedAt.current = Date.now();
    setMegaOpen(true);
  };
  // A mouse user hovers (opens) and then clicks: that click must not close it.
  // Keyboard and touch users get a normal toggle.
  const toggleMega = () => {
    if (Date.now() - hoverOpenedAt.current < 600) {
      setMegaOpen(true);
      return;
    }
    setMegaOpen((v) => !v);
  };
  const scheduleCloseMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 120);
  };

  const isActive = (href: string) =>
    pathname !== null && (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const hasCategories = categories.length > 0;

  return (
    <>
      <Suspense fallback={null}>
        <PathnameListener onChange={handlePathname} />
      </Suspense>

      <header
        data-site-header=""
        data-scrolled={scrolled || megaOpen ? "true" : "false"}
        data-menu-open={mobileOpen ? "true" : "false"}
        className={cn(
          "site-header fixed inset-x-0 top-0 z-50 border-b transition-[transform,background-color,color,border-color] duration-500 ease-(--ease-out)",
          hidden && !megaOpen && !mobileOpen && "-translate-y-full",
        )}
      >
        <div className="container-site flex h-(--header-height) items-center justify-between gap-6">
          <Link href="/" className="relative z-10 flex shrink-0 items-center" aria-label={`${brandName} home`}>
            <span className="logo-default">{logo}</span>
            <span className="logo-inverse">{logoInverse}</span>
          </Link>

          <nav aria-label="Main" className="absolute left-1/2 hidden -translate-x-1/2 lg:block">
            <ul className="flex items-center gap-1">
              {items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="nav-link relative block px-3.5 py-2 text-[0.9375rem] font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {hasCategories && (
                <li onMouseEnter={openMega} onMouseLeave={scheduleCloseMega}>
                  <button
                    type="button"
                    aria-expanded={megaOpen}
                    aria-controls={megaId}
                    onClick={toggleMega}
                    className="nav-link flex items-center gap-1 px-3.5 py-2 text-[0.9375rem] font-medium"
                  >
                    {categoriesLabel}
                    <ChevronDown
                      aria-hidden
                      className={cn("size-4 transition-transform duration-300", megaOpen && "rotate-180")}
                    />
                  </button>
                </li>
              )}
            </ul>
          </nav>

          <div className="relative z-10 flex items-center gap-2">
            {cta && (
              <Link
                href={cta.href}
                className="header-cta btn-pill hidden min-h-10 px-5 text-sm sm:inline-flex"
              >
                {cta.label}
              </Link>
            )}
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full transition hover:bg-black/5 lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls={mobileId}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
            </button>
          </div>
        </div>

        {/* Desktop mega menu */}
        <AnimatePresence>
          {megaOpen && hasCategories && (
            <motion.div
              id={megaId}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onMouseEnter={openMega}
              onMouseLeave={scheduleCloseMega}
              className="absolute inset-x-0 top-full hidden border-b border-line bg-background text-ink lg:block"
            >
              <div className="container-site grid grid-cols-12 gap-10 py-12">
                <div className="col-span-3">
                  <p className="text-eyebrow text-ink-muted">{categoriesLabel}</p>
                  <Link
                    href="/projects"
                    className="mt-5 inline-flex items-center gap-2 text-title hover:underline underline-offset-[6px]"
                  >
                    All projects <ArrowUpRight className="size-5" aria-hidden />
                  </Link>
                </div>
                <ul className="col-span-9 grid grid-cols-3 gap-x-10 gap-y-4">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/projects?category=${encodeURIComponent(c.slug)}`}
                        className="group flex items-baseline justify-between gap-4 border-b border-line py-3 text-[1.0625rem] font-medium"
                      >
                        <span className="group-hover:underline underline-offset-[6px]">{c.name}</span>
                        <span className="text-sm text-ink-muted tabular-nums">{c.projectCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Dim page behind mega menu */}
      <AnimatePresence>
        {megaOpen && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 hidden bg-black/20 backdrop-blur-[2px] lg:block"
            onClick={() => setMegaOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id={mobileId}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-background pt-(--header-height) lg:hidden"
          >
            <nav aria-label="Mobile" className="container-site flex min-h-full flex-col pb-10 pt-6">
              <ul className="space-y-1">
                {items.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className="block py-2 text-[2rem] font-semibold tracking-tight aria-[current=page]:text-brand"
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>

              {hasCategories && (
                <div className="mt-10">
                  <p className="text-eyebrow text-ink-muted">{categoriesLabel}</p>
                  <ul className="mt-4 divide-y divide-line border-y border-line">
                    {categories.map((c) => (
                      <li key={c.slug}>
                        <Link
                          href={`/projects?category=${encodeURIComponent(c.slug)}`}
                          className="flex items-center justify-between py-4 text-lg font-medium"
                        >
                          {c.name}
                          <span className="text-sm text-ink-muted tabular-nums">{c.projectCount}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-auto space-y-6 pt-12">
                {cta && (
                  <Link href={cta.href} className="btn-pill w-full bg-primary text-primary-foreground">
                    {cta.label}
                  </Link>
                )}
                {(contactLine?.email || contactLine?.phone) && (
                  <div className="space-y-1 text-sm text-ink-muted">
                    {contactLine.email && (
                      <a className="block hover:text-ink" href={`mailto:${contactLine.email}`}>
                        {contactLine.email}
                      </a>
                    )}
                    {contactLine.phone && (
                      <a className="block hover:text-ink" href={`tel:${contactLine.phone.replace(/\s/g, "")}`}>
                        {contactLine.phone}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
