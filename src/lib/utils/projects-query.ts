/** Shared by the server listing page and the client filter bar. */
export type ProjectQuery = { category: string; q: string; sort: "featured" | "newest" };

export function buildProjectsHref(query: Partial<ProjectQuery>) {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.q) params.set("q", query.q);
  if (query.sort && query.sort !== "featured") params.set("sort", query.sort);
  const qs = params.toString();
  return qs ? `/projects?${qs}` : "/projects";
}
