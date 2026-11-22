import "server-only";
import { Resend } from "resend";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type EnquiryEmail = {
  brandName: string;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  projectTitle?: string | null;
  projectUrl?: string | null;
  adminUrl: string;
  /** Recipients from Settings → Notifications; falls back to CONTACT_EMAIL. */
  recipients?: string | null;
};

/**
 * Sends the enquiry notification through Resend. Optional: returns
 * { sent: false } when RESEND_API_KEY or a recipient (Settings →
 * Notifications, else CONTACT_EMAIL) is not configured.
 * Credentials never leave the server.
 */
export async function sendEnquiryNotification(data: EnquiryEmail) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = (data.recipients?.trim() || process.env.CONTACT_EMAIL || "")
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!apiKey || to.length === 0) return { sent: false as const, reason: "not-configured" };

  const from = process.env.RESEND_FROM_EMAIL || "Website enquiries <onboarding@resend.dev>";
  const rows: [string, string | null | undefined][] = [
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.phone],
    ["Subject", data.subject],
    ["Project", data.projectTitle ? `${data.projectTitle}${data.projectUrl ? ` (${data.projectUrl})` : ""}` : null],
  ];

  const text = [
    `New enquiry via the ${data.brandName} website`,
    "",
    ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
    "",
    data.message,
    "",
    `Manage enquiries: ${data.adminUrl}`,
  ].join("\n");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:600px">
    <h2 style="font-size:18px;margin:0 0 16px">New website enquiry</h2>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      ${rows
        .filter(([, v]) => v)
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 12px 6px 0;color:#666;width:90px;vertical-align:top">${escapeHtml(k)}</td><td style="padding:6px 0">${escapeHtml(String(v))}</td></tr>`,
        )
        .join("")}
    </table>
    <div style="margin:20px 0;padding:16px;background:#f5f5f5;white-space:pre-wrap;font-size:14px;line-height:1.6">${escapeHtml(data.message)}</div>
    <a href="${escapeHtml(data.adminUrl)}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:14px">Open in dashboard</a>
  </div>`;

  const resend = new Resend(apiKey);
  const subjectLine = `New enquiry: ${data.subject || data.projectTitle || data.name}`.slice(0, 150);
  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: data.email,
    subject: subjectLine.replace(/[\r\n]+/g, " "),
    text,
    html,
  });
  if (error) {
    console.error("[email] Resend failed:", error.name);
    return { sent: false as const, reason: "send-failed" };
  }
  return { sent: true as const };
}
