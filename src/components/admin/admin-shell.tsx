"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { ExternalLink, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AdminNav, AdminNavLinks } from "./admin-nav";
import { signOutAction } from "@/lib/auth/actions";

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2 px-3 text-sm font-semibold uppercase tracking-[0.14em]">
      <span aria-hidden className="flex flex-col gap-[2px]">
        <span className="block h-[2px] w-4 bg-current" />
        <span className="block h-[2px] w-4 bg-current opacity-60" />
        <span className="block h-[2px] w-4 bg-(--brand)" />
      </span>
      Studio CMS
    </Link>
  );
}

function SidebarFooter() {
  return (
    <div className="space-y-1 border-t pt-4">
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <ExternalLink className="size-4" aria-hidden /> View website
      </a>
      <form action={signOutAction}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden /> Sign out
        </button>
      </form>
    </div>
  );
}

/** Sidebar on desktop, sheet on mobile. Auth is enforced by the server, not here. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-svh bg-muted/40 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col gap-6 border-r bg-background p-4 lg:flex">
        <div className="pt-2">
          <Brand />
        </div>
        <nav aria-label="Admin" className="flex-1 overflow-y-auto">
          <Suspense fallback={<AdminNavLinks pathname={null} />}>
            <AdminNav />
          </Suspense>
        </nav>
        <SidebarFooter />
      </aside>

      <div className="min-w-0">
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
          <Brand />
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open admin menu">
            <Menu />
          </Button>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" className="flex w-72 flex-col gap-6 p-4">
            <SheetHeader className="p-0">
              <SheetTitle className="sr-only">Admin menu</SheetTitle>
              <Brand />
            </SheetHeader>
            <nav aria-label="Admin mobile" className="flex-1">
              <Suspense fallback={<AdminNavLinks pathname={null} />}>
                <AdminNav onNavigate={() => setOpen(false)} />
              </Suspense>
            </nav>
            <SidebarFooter />
          </SheetContent>
        </Sheet>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
