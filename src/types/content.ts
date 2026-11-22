import type { ProjectSection } from "@/lib/validations/sections";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImagePath: string | null;
  displayOrder: number;
  projectCount: number;
};

export type ProjectSummary = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  coverImagePath: string | null;
  coverImageAlt: string | null;
  isFeatured: boolean;
  displayOrder: number;
  publishedAt: string | null;
  completionDate: string | null;
  location: string | null;
  category: { id: string; name: string; slug: string } | null;
};

export type ProjectMediaItem = {
  id: string;
  type: "image" | "video";
  path: string;
  alt: string | null;
  caption: string | null;
};

export type ProjectDetail = ProjectSummary & {
  description: string | null;
  applicationType: string | null;
  materialUsed: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: string;
  media: ProjectMediaItem[];
  sections: ProjectSection[];
};
