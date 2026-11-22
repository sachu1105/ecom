"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ExternalLink, Mail, MailOpen, Phone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAction } from "@/components/admin/use-action";
import { deleteInquiryAction, setInquiryStatusAction } from "@/lib/actions/content";
import { formatDateTime } from "@/lib/utils/format";
import type { InquiryRow } from "@/types/database";
import { cn } from "@/lib/utils";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "new", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
] as const;

export function InquiriesInbox({
  inquiries,
  status,
  openId,
  projectSlugs,
}: {
  inquiries: InquiryRow[];
  status: string;
  openId?: string;
  projectSlugs: Record<string, string>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(openId ?? null);
  const [toDelete, setToDelete] = useState<InquiryRow | null>(null);
  const { run, pending } = useAction();
  const selected = inquiries.find((i) => i.id === selectedId) ?? null;

  const open = (inquiry: InquiryRow) => {
    setSelectedId(inquiry.id);
    if (inquiry.status === "new") run(() => setInquiryStatusAction(inquiry.id, "read"));
  };

  return (
    <div className="rounded-lg border bg-background">
      <nav aria-label="Filter enquiries" className="flex gap-1 border-b p-3">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/admin/inquiries" : `/admin/inquiries?status=${f.value}`}
            aria-current={status === f.value ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              status === f.value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {inquiries.length === 0 ? (
        <p className="p-10 text-center text-sm text-muted-foreground">No enquiries here.</p>
      ) : (
        <ul className="divide-y">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id}>
              <button
                type="button"
                onClick={() => open(inquiry)}
                className="flex w-full items-start gap-4 p-4 text-left hover:bg-muted/50"
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", inquiry.status === "new" ? "bg-primary" : "bg-transparent")} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={cn(inquiry.status === "new" && "font-semibold")}>{inquiry.name}</span>
                    <span className="text-sm text-muted-foreground">{inquiry.email}</span>
                    {inquiry.status === "new" && <Badge>New</Badge>}
                    {inquiry.status === "archived" && <Badge variant="secondary">Archived</Badge>}
                  </span>
                  <span className="mt-0.5 block truncate text-sm">
                    {inquiry.subject && <span className="font-medium">{inquiry.subject} · </span>}
                    <span className="text-muted-foreground">{inquiry.message}</span>
                  </span>
                  {inquiry.project_title && (
                    <span className="mt-1 block text-xs text-muted-foreground">Project: {inquiry.project_title}</span>
                  )}
                </span>
                <time className="shrink-0 text-xs text-muted-foreground" dateTime={inquiry.created_at}>
                  {formatDateTime(inquiry.created_at)}
                </time>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.subject || `Enquiry from ${selected.name}`}</SheetTitle>
                <SheetDescription>Received {formatDateTime(selected.created_at)}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-6">
                <dl className="space-y-3 rounded-md bg-muted p-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Name</dt>
                    <dd className="font-medium">{selected.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Email</dt>
                    <dd>
                      <a className="underline underline-offset-4" href={`mailto:${selected.email}`}>
                        {selected.email}
                      </a>
                    </dd>
                  </div>
                  {selected.phone && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Phone</dt>
                      <dd>
                        <a className="underline underline-offset-4" href={`tel:${selected.phone.replace(/\s/g, "")}`}>
                          {selected.phone}
                        </a>
                      </dd>
                    </div>
                  )}
                  {selected.project_title && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Related project</dt>
                      <dd className="flex items-center gap-2">
                        {selected.project_title}
                        {selected.project_id && projectSlugs[selected.project_id] && (
                          <a
                            href={`/projects/${projectSlugs[selected.project_id]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Open project"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">Message</p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.message}</p>
                </div>
                <div className="flex flex-wrap gap-2 border-t pt-4">
                  <Button asChild size="sm">
                    <a href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || "Your enquiry"}`)}`}>
                      <Mail /> Reply
                    </a>
                  </Button>
                  {selected.phone && (
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${selected.phone.replace(/\s/g, "")}`}>
                        <Phone /> Call
                      </a>
                    </Button>
                  )}
                  {selected.status !== "new" ? (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setInquiryStatusAction(selected.id, "new"), { success: "Marked as unread." })}>
                      <MailOpen /> Mark unread
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setInquiryStatusAction(selected.id, "read"), { success: "Marked as read." })}>
                      <MailOpen /> Mark read
                    </Button>
                  )}
                  {selected.status !== "archived" && (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setInquiryStatusAction(selected.id, "archived"), { success: "Archived." })}>
                      <Archive /> Archive
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setToDelete(selected)}>
                    <Trash2 /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this enquiry?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the customer&apos;s message and contact details.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (toDelete) run(() => deleteInquiryAction(toDelete.id), { onSuccess: () => setSelectedId(null) });
                setToDelete(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
