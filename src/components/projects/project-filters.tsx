"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildProjectsHref, type ProjectQuery } from "@/lib/utils/projects-query";

type Props = {
  categories: { name: string; slug: string; projectCount: number }[];
  query: ProjectQuery;
  total: number;
  resultCount: number;
};

/**
 * Category chips are plain links (crawlable, work without JS). Search and sort
 * update the URL, which re-renders the server results.
 */
export function ProjectFilters({ categories, query, total, resultCount }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState(query.q);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the input in sync when navigating with back/forward.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing external URL state
    setSearch(query.q);
  }, [query.q]);

  const navigate = (next: Partial<ProjectQuery>) => {
    startTransition(() => {
      router.replace(buildProjectsHref({ ...query, ...next }), { scroll: false });
    });
  };

  const onSearch = (value: string) => {
    setSearch(value);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => navigate({ q: value.trim().slice(0, 80) }), 300);
  };

  const chip = (active: boolean) =>
    cn(
      "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
      active ? "border-ink bg-ink text-white" : "border-line bg-background text-ink hover:border-ink",
    );

  return (
    <div className="sticky top-0 z-30 border-b border-line bg-background/95 backdrop-blur-md">
      <div className="container-site flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter by category" className="-mx-(--gutter) min-w-0 lg:mx-0">
          <ul className="scrollbar-none flex gap-2 overflow-x-auto px-(--gutter) lg:flex-wrap lg:px-0">
            <li>
              <Link href={buildProjectsHref({ ...query, category: "" })} scroll={false} className={chip(!query.category)}>
                All <span className="tabular-nums opacity-60">{total}</span>
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={buildProjectsHref({ ...query, category: c.slug })}
                  scroll={false}
                  aria-current={query.category === c.slug ? "true" : undefined}
                  className={chip(query.category === c.slug)}
                >
                  {c.name} <span className="tabular-nums opacity-60">{c.projectCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 lg:w-72 lg:flex-none">
            <label htmlFor="project-search" className="sr-only">
              Search projects
            </label>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              id="project-search"
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search projects"
              maxLength={80}
              className="h-11 w-full rounded-full bg-surface-muted pl-11 pr-10 text-sm outline-none transition focus:bg-background focus:ring-2 focus:ring-ink/80"
            />
            {pending ? (
              <Loader2 className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-muted" aria-hidden />
            ) : (
              search && (
                <button
                  type="button"
                  onClick={() => onSearch("")}
                  className="absolute right-3 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full hover:bg-line"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )
            )}
          </div>
          <label htmlFor="project-sort" className="sr-only">
            Sort projects
          </label>
          <select
            id="project-sort"
            value={query.sort}
            onChange={(e) => navigate({ sort: e.target.value as ProjectQuery["sort"] })}
            className="h-11 rounded-full border border-line bg-background px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-ink/80"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {resultCount} {resultCount === 1 ? "project" : "projects"} shown
      </p>
    </div>
  );
}
