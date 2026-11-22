/**
 * WhatsApp click-to-chat links. The phone number always comes from site
 * settings (contact.whatsapp, falling back to WHATSAPP_PHONE), never from a
 * component.
 */

export function normaliseWhatsAppNumber(phone: string | null | undefined) {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  return digits.length >= 7 && digits.length <= 15 ? digits : null;
}

export function buildWhatsAppUrl(phone: string | null | undefined, message?: string) {
  const number = normaliseWhatsAppNumber(phone);
  if (!number) return null;
  const url = new URL(`https://wa.me/${number}`);
  if (message) url.searchParams.set("text", message.slice(0, 1000));
  return url.toString();
}

export function projectEnquiryMessage(opts: {
  brandName: string;
  projectTitle: string;
  projectUrl: string;
  context?: string;
}) {
  return [
    `Hello ${opts.brandName}, I'm interested in a project like "${opts.projectTitle}".`,
    opts.context ? opts.context : "Could you tell me more about a similar installation?",
    `Project: ${opts.projectUrl}`,
  ].join("\n\n");
}
