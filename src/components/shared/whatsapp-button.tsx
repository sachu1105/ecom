import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { WhatsAppIcon } from "./social-icons";
import { cn } from "@/lib/utils";

type WhatsAppButtonProps = {
  phone: string | null | undefined;
  message?: string;
  label?: string;
  variant?: "solid" | "outline" | "light" | "outline-light";
  className?: string;
};

const styles = {
  solid: "bg-primary text-primary-foreground hover:bg-primary/85",
  outline: "border border-ink/25 text-ink hover:border-ink",
  light: "bg-background text-ink hover:bg-background/85",
  "outline-light": "border border-white/50 text-white hover:border-white hover:bg-white/10",
};

/** Reusable click-to-chat button. Renders nothing if no number is configured. */
export function WhatsAppButton({
  phone,
  message,
  label = "Chat on WhatsApp",
  variant = "outline",
  className,
}: WhatsAppButtonProps) {
  const href = buildWhatsAppUrl(phone, message);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("btn-pill", styles[variant], className)}
    >
      <WhatsAppIcon className="size-[1.1rem]" />
      {label}
    </a>
  );
}
