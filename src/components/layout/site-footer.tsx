import Link from "next/link";
import { cacheLife } from "next/cache";
import { Logo } from "./logo";
import { SocialIcon, SOCIAL_LABELS, WhatsAppIcon } from "@/components/shared/social-icons";
import { buildWhatsAppUrl } from "@/lib/utils/whatsapp";
import { fillTemplate } from "@/lib/utils/format";
import type { SiteSettings } from "@/lib/validations/settings";
import type { Category } from "@/types/content";
import type { NavItem } from "./site-header";

/** The year is cached so the footer stays in the prerendered static shell. */
async function getCurrentYear() {
  "use cache";
  cacheLife("days");
  return String(new Date().getUTCFullYear());
}

export async function SiteFooter({
  settings,
  categories,
  navItems,
}: {
  settings: SiteSettings;
  categories: Category[];
  navItems: NavItem[];
}) {
  const { brand, contact, social, footer } = settings;
  const year = await getCurrentYear();
  const whatsappUrl = buildWhatsAppUrl(contact.whatsapp, contact.whatsappMessage || undefined);
  const copyright = footer.copyright
    ? fillTemplate(footer.copyright, { year, brand: brand.name })
    : `© ${year} ${brand.name}`;
  const showCategories = footer.showCategories && categories.length > 0;

  return (
    <footer className="border-t border-white/10 bg-ink text-white">
      <div className="container-site grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-4">
          <Link href="/" aria-label={`${brand.name} home`} className="inline-flex">
            <Logo name={brand.name} logo={brand.logoInverse ?? brand.logo} />
          </Link>
          {(footer.description || brand.tagline) && (
            <p className="max-w-sm text-[0.9375rem] leading-relaxed text-white/65">
              {footer.description || brand.tagline}
            </p>
          )}
          {social.links.length > 0 && (
            <ul className="flex flex-wrap gap-2 pt-2">
              {social.links.map((link) => (
                <li key={`${link.platform}-${link.url}`}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={SOCIAL_LABELS[link.platform]}
                    className="grid size-10 place-items-center rounded-full border border-white/20 text-white/80 transition hover:border-white hover:text-white"
                  >
                    <SocialIcon platform={link.platform} className="size-[1.1rem]" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8">
          <div>
            <p className="text-eyebrow text-white/50">Explore</p>
            <ul className="mt-5 space-y-3">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[0.9375rem] text-white/85 hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {showCategories && (
            <div>
              <p className="text-eyebrow text-white/50">Applications</p>
              <ul className="mt-5 space-y-3">
                {categories.slice(0, 8).map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/projects?category=${encodeURIComponent(c.slug)}`}
                      className="text-[0.9375rem] text-white/85 hover:text-white"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="col-span-2 sm:col-span-1">
            <p className="text-eyebrow text-white/50">Contact</p>
            <address className="mt-5 space-y-3 text-[0.9375rem] not-italic text-white/85">
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="block hover:text-white">
                  {contact.email}
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="block hover:text-white">
                  {contact.phone}
                </a>
              )}
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-white"
                >
                  <WhatsAppIcon className="size-4" /> WhatsApp
                </a>
              )}
              {contact.address && <p className="whitespace-pre-line text-white/65">{contact.address}</p>}
              {contact.hours && <p className="text-white/50">{contact.hours}</p>}
            </address>
          </div>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-3 py-6 text-[0.8125rem] text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>{copyright}</p>
          {brand.tagline && <p className="text-white/40">{brand.tagline}</p>}
        </div>
      </div>
    </footer>
  );
}
