/**
 * Database types. They mirror supabase/migrations and follow the shape produced by
 * `supabase gen types typescript`, so they can be regenerated later
 * (`npm run db:types`) without touching call-sites.
 *
 * JSONB columns are typed as `Json` here; their structure is validated at the
 * application layer by the Zod schemas in src/lib/validations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProjectStatus = "draft" | "published";
export type InquiryStatus = "new" | "read" | "archived";
export type MediaKind = "image" | "video";
export type ProfileRole = "admin" | "viewer";

export type ProfileRow = {
  id: string;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
};

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_path: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  location: string | null;
  completion_date: string | null;
  application_type: string | null;
  material_used: string | null;
  cover_image_path: string | null;
  cover_image_alt: string | null;
  status: ProjectStatus;
  is_featured: boolean;
  display_order: number;
  seo_title: string | null;
  seo_description: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectMediaRow = {
  id: string;
  project_id: string;
  media_type: MediaKind;
  storage_path: string;
  alt_text: string | null;
  caption: string | null;
  display_order: number;
  created_at: string;
};

export type ProjectSectionRow = {
  id: string;
  project_id: string;
  section_type: string;
  heading: string | null;
  content: Json;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type HomepageSectionRow = {
  id: string;
  section_type: string;
  title: string | null;
  content: Json;
  settings: Json;
  is_enabled: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type HomepageSectionDraftRow = {
  section_id: string;
  title: string | null;
  content: Json;
  settings: Json;
  updated_at: string;
};

export type SiteSettingRow = {
  id: string;
  key: string;
  value: Json;
  is_public: boolean;
  updated_at: string;
};

export type PageRow = {
  id: string;
  page_key: string;
  title: string;
  content: Json;
  seo_title: string | null;
  seo_description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type MediaAssetRow = {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string;
  media_type: MediaKind;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type InquiryRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  project_id: string | null;
  project_title: string | null;
  status: InquiryStatus;
  read_at: string | null;
  created_at: string;
};

/** Columns with database defaults become optional on insert. */
type Insertable<Row, Optional extends keyof Row> = Omit<Row, Optional> &
  Partial<Pick<Row, Optional>>;

type TableDef<Row, Optional extends keyof Row> = {
  Row: Row;
  Insert: Insertable<Row, Optional>;
  Update: Partial<Row>;
  Relationships: [];
};

type Timestamps = "created_at" | "updated_at";

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, "role" | Timestamps>;
      project_categories: TableDef<
        CategoryRow,
        | "id"
        | "description"
        | "cover_image_path"
        | "is_active"
        | "display_order"
        | Timestamps
      >;
      projects: TableDef<
        ProjectRow,
        | "id"
        | "short_description"
        | "description"
        | "category_id"
        | "location"
        | "completion_date"
        | "application_type"
        | "material_used"
        | "cover_image_path"
        | "cover_image_alt"
        | "status"
        | "is_featured"
        | "display_order"
        | "seo_title"
        | "seo_description"
        | "published_at"
        | Timestamps
      >;
      project_media: TableDef<
        ProjectMediaRow,
        "id" | "alt_text" | "caption" | "display_order" | "created_at"
      >;
      project_sections: TableDef<
        ProjectSectionRow,
        "id" | "heading" | "content" | "display_order" | Timestamps
      >;
      homepage_sections: TableDef<
        HomepageSectionRow,
        | "id"
        | "title"
        | "content"
        | "settings"
        | "is_enabled"
        | "display_order"
        | Timestamps
      >;
      homepage_section_drafts: TableDef<
        HomepageSectionDraftRow,
        "title" | "updated_at"
      >;
      site_settings: TableDef<SiteSettingRow, "id" | "is_public" | "updated_at">;
      pages: TableDef<
        PageRow,
        | "id"
        | "content"
        | "seo_title"
        | "seo_description"
        | "is_published"
        | Timestamps
      >;
      media_assets: TableDef<
        MediaAssetRow,
        "id" | "width" | "height" | "alt_text" | "created_by" | Timestamps
      >;
      inquiries: TableDef<
        InquiryRow,
        | "id"
        | "phone"
        | "subject"
        | "project_id"
        | "project_title"
        | "status"
        | "read_at"
        | "created_at"
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
