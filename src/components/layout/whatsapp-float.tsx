import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { WhatsAppIcon } from "@/components/shared/social-icons";

/** Floating general-enquiry WhatsApp button (number from site settings). */
export function WhatsAppFloat({ phone, message }: { phone: string; message?: string }) {
  const href = buildWhatsAppUrl(phone, message);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink md:bottom-8 md:right-8"
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
