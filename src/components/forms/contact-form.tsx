"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { contactFormSchema, type ContactFormInput } from "@/lib/validations/forms";
import { cn } from "@/lib/utils";

type ContactFormProps = {
  projects: { slug: string; title: string }[];
  defaultProject?: string;
  successMessage?: string;
};

// Every field shares one label + underline style so the grid lines up exactly.
const label = "block text-sm text-ink-muted";
const field =
  "mt-2 block w-full rounded-none border-0 border-b border-line bg-transparent px-0 pb-3 pt-1 text-base outline-none transition-colors focus:border-ink aria-invalid:border-destructive";

export function ContactForm({ projects, defaultProject = "", successMessage }: ContactFormProps) {
  const [sent, setSent] = useState(false);
  // Mount time for the server-side minimum-fill-time check (set after hydration,
  // so nothing time-dependent happens during prerendering).
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormInput>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      project: projects.some((p) => p.slug === defaultProject) ? defaultProject : "",
      website: "",
      startedAt: 0,
    },
  });

  async function submit(values: ContactFormInput) {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, startedAt: startedAt.current }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: Record<string, string>;
      };
      if (!res.ok || !data.ok) {
        if (data.fieldErrors) {
          for (const [name, message] of Object.entries(data.fieldErrors)) {
            setError(name as keyof ContactFormInput, { message });
          }
        }
        toast.error(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
      reset();
      startedAt.current = Date.now();
      toast.success("Thank you, your enquiry has been sent.");
    } catch {
      toast.error("We couldn't reach the server. Please check your connection and try again.");
    }
  }

  // handleSubmit is invoked inside the event handler (not during render).
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    void handleSubmit(submit)(event);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-start gap-6 bg-surface-muted p-8 md:p-12" role="status">
        <CheckCircle2 className="size-10 text-brand" aria-hidden />
        <div>
          <p className="text-title">Enquiry received</p>
          <p className="mt-3 max-w-md text-ink-muted">
            {successMessage || "Thank you for getting in touch. We'll reply as soon as possible."}
          </p>
        </div>
        <button type="button" onClick={() => setSent(false)} className="btn-pill border border-ink/25 hover:border-ink">
          Send another enquiry
        </button>
      </div>
    );
  }

  const err = (name: keyof ContactFormInput) =>
    errors[name]?.message ? (
      <p id={`${name}-error`} className="mt-2 text-sm text-destructive">
        {String(errors[name]?.message)}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      {/* Honeypot: hidden from people, tempting to bots */}
      <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </div>

      <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={label}>
            Name *
          </label>
          <input
            id="name"
            autoComplete="name"
            className={field}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {err("name")}
        </div>
        <div>
          <label htmlFor="email" className={label}>
            Email *
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={field}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {err("email")}
        </div>
        <div>
          <label htmlFor="phone" className={label}>
            Phone
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            className={field}
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            {...register("phone")}
          />
          {err("phone")}
        </div>
        <div>
          <label htmlFor="subject" className={label}>
            Subject
          </label>
          <input id="subject" className={field} {...register("subject")} />
          {err("subject")}
        </div>
      </div>

      {projects.length > 0 && (
        <div>
          <label htmlFor="project" className={label}>
            Related project <span className="text-ink-muted/70">(optional)</span>
          </label>
          <div className="relative">
            <select id="project" className={cn(field, "cursor-pointer appearance-none pr-8")} {...register("project")}>
              <option value="">No specific project</option>
              {projects.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.title}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="message" className={label}>
          Tell us about your surfaces and project *
        </label>
        <textarea
          id="message"
          rows={4}
          className={cn(field, "resize-y")}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          {...register("message")}
        />
        {err("message")}
      </div>

      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-muted">We only use your details to respond to this enquiry.</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-pill bg-primary text-primary-foreground hover:bg-primary/85 disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {isSubmitting ? "Sending…" : "Send enquiry"}
        </button>
      </div>
    </form>
  );
}
