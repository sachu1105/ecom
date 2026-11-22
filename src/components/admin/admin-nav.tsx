"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  FolderKanban,
  House,
  Images,
  Inbox,
  LayoutDashboard,
  Settings,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/homepage", label: "Homepage", icon: House },
  { href: "/admin/media", label: "Media", icon: Images },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/inquiries", label: "Enquiries", icon: Inbox },
  { href: "/admin/settings", label: "Settings", icon: Settings },
] as const;

/** Pure list (no hooks) so it can also render as the Suspense fallback. */
export function AdminNavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <ul className="space-y-0.5">
      {ADMIN_NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname !== null && (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <AdminNavLinks pathname={pathname} onNavigate={onNavigate} />;
}
