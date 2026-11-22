import { NextResponse, type NextRequest } from "next/server";
import { contactFormSchema } from "@/lib/validations/forms";
import { fieldErrors } from "@/lib/validations/common";
import { getServiceSupabase } from "@/lib/supabase/admin";
import { getPublishedProjects, getSiteSettings } from "@/lib/content/queries";
import { clientIpFrom, rateLimit } from "@/lib/utils/rate-limit";
import { sendEnquiryNotification } from "@/lib/email/notify";
import { absoluteUrl } from "@/lib/utils/site";
import { siteSettingSchemas } from "@/lib/validations/settings";

const MAX_BODY_BYTES = 16 * 1024;
const MIN_FILL_MS = 2500;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/contact
 *   1. Same-origin + size checks   2. Zod validation   3. Honeypot / timing
 *   4. Rate limiting (DB-backed)    5. Insert (service role)   6. Optional Resend email
 */
export async function POST(request: NextRequest) {
  // Reject cross-site posts: the Origin host must match the host the request
  // was sent to (X-Forwarded-Host when behind a proxy/CDN).
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    if (!host || originHost !== host) {
      return json(403, { ok: false, error: "Invalid request origin." });
    }
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json(415, { ok: false, error: "Unsupported content type." });
  }
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) {
    return json(413, { ok: false, error: "Message is too large." });
  }

  let raw: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json(413, { ok: false, error: "Message is too large." });
    raw = JSON.parse(text);
  } catch {
    return json(400, { ok: false, error: "Invalid request." });
  }

  const parsed = contactFormSchema.safeParse(raw);
  if (!parsed.success) {
    return json(422, {
      ok: false,
      error: "Please check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    });
  }
  const input = parsed.data;

  // Bots: filled honeypot or impossibly fast submission. Pretend success.
  const elapsed = Date.now() - input.startedAt;
  if (input.website || !input.startedAt || elapsed < MIN_FILL_MS) {
    return json(200, { ok: true });
  }

  const ip = clientIpFrom(request.headers);
  const [burstOk, dailyOk] = await Promise.all([
    rateLimit({ scope: "contact:burst", identifier: ip, limit: 3, windowSeconds: 600 }),
    rateLimit({ scope: "contact:day", identifier: ip, limit: 20, windowSeconds: 86400 }),
  ]);
  if (!burstOk || !dailyOk) {
    return json(429, {
      ok: false,
      error: "You've sent several messages recently. Please wait a few minutes and try again.",
    });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    console.error("[contact] SUPABASE_SERVICE_ROLE_KEY is not configured");
    return json(503, { ok: false, error: "Enquiries are temporarily unavailable. Please email or call us." });
  }

  // Resolve the optional related project against *published* projects only.
  const [projects, settings] = await Promise.all([getPublishedProjects(), getSiteSettings()]);
  const project = input.project ? projects.find((p) => p.slug === input.project) : undefined;

  const { error } = await supabase.from("inquiries").insert({
    name: input.name,
    email: input.email.toLowerCase(),
    phone: input.phone || null,
    subject: input.subject || null,
    message: input.message,
    project_id: project?.id ?? null,
    project_title: project?.title ?? null,
  });
  if (error) {
    console.error("[contact] insert failed:", error.code);
    return json(500, { ok: false, error: "We couldn't save your enquiry. Please try again shortly." });
  }

  try {
    // Private setting (is_public = false): read with the service role, uncached,
    // so a change in Settings → Notifications applies to the next enquiry.
    const { data: row } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "notifications")
      .maybeSingle();
    const notifications = siteSettingSchemas.notifications.safeParse(row?.value ?? {});

    await sendEnquiryNotification({
      recipients: notifications.success ? notifications.data.enquiryEmails : null,
      brandName: settings.brand.name,
      name: input.name,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
      projectTitle: project?.title,
      projectUrl: project ? absoluteUrl(`/projects/${project.slug}`, settings.seo.siteUrl) : null,
      adminUrl: absoluteUrl("/admin/inquiries", settings.seo.siteUrl),
    });
  } catch (e) {
    // The enquiry is stored; a failed notification must not fail the request.
    console.error("[contact] notification error", e instanceof Error ? e.name : "unknown");
  }

  return json(200, { ok: true });
}
