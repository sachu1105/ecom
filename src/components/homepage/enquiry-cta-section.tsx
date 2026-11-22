import { CtaLink } from "@/components/shared/cta-link";
import { WhatsAppButton } from "@/components/shared/whatsapp-button";
import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  heading: string;
  body?: string;
  cta?: { label: string; href: string };
  whatsapp?: { phone: string; message?: string } | null;
  theme?: "dark" | "light" | "brand";
};

const themes = {
  dark: "bg-dark text-white",
  light: "bg-surface-muted text-ink",
  brand: "bg-brand text-brand-foreground",
};

const eyebrowTone = {
  dark: "text-brand-light",
  light: "text-brand-ink",
  brand: "opacity-70",
};

/** Closing enquiry call-to-action, reused on the homepage, project and about pages. */
export function EnquiryCta({ eyebrow, heading, body, cta, whatsapp, theme = "dark" }: Props) {
  if (!heading) return null;
  const onDark = theme !== "light";
  return (
    <section className={cn("section-y", themes[theme])}>
      <div className="container-site">
        <Reveal className="mx-auto max-w-4xl text-center">
          {eyebrow && (
            <p className={cn("text-eyebrow mb-5", eyebrowTone[theme])}>{eyebrow}</p>
          )}
          <h2 className="text-display text-balance">{heading}</h2>
          {body && (
            <p className={cn("text-lead mx-auto mt-6 max-w-2xl", onDark ? "opacity-80" : "text-ink-muted")}>{body}</p>
          )}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {cta?.label && (
              <CtaLink href={cta.href} variant={onDark ? "light" : "solid"}>
                {cta.label}
              </CtaLink>
            )}
            {whatsapp && (
              <WhatsAppButton
                phone={whatsapp.phone}
                message={whatsapp.message}
                variant={onDark ? "outline-light" : "outline"}
              />
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
