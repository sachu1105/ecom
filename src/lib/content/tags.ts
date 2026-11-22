/** Cache tags for public content. Admin mutations expire these with updateTag(). */
export const CACHE_TAGS = {
  projects: "projects",
  categories: "categories",
  homepage: "homepage",
  pages: "pages",
  settings: "settings",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];
