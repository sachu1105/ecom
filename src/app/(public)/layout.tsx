import { BrandStyle } from "@/components/layout/brand-style";
import { Logo } from "@/components/layout/logo";
import { SiteHeader, type NavItem } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { WhatsAppFloat } from "@/components/layout/whatsapp-float";
import { getActiveCategories, getSiteSettings } from "@/lib/content/queries";

export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const [settings, categories] = await Promise.all([getSiteSettings(), getActiveCategories()]);
  const { brand, navigation, contact } = settings;

  const navItems: NavItem[] = [
    { label: "Home", href: "/" },
    { label: navigation.projectsLabel || "Projects", href: "/projects" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const cta = navigation.showCta && navigation.cta.label && navigation.cta.href ? navigation.cta : null;

  return (
    <>
      <BrandStyle accent={brand.accentColor} />
      <a
        href="#main"
        className="sr-only z-60 rounded-full bg-ink px-5 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <SiteHeader
        brandName={brand.name}
        logo={<Logo name={brand.name} logo={brand.logo} />}
        logoInverse={<Logo name={brand.name} logo={brand.logoInverse ?? brand.logo} />}
        items={navItems}
        categories={
          navigation.showCategoryMenu
            ? categories.map((c) => ({ name: c.name, slug: c.slug, projectCount: c.projectCount }))
            : []
        }
        categoriesLabel={navigation.categoriesLabel || "Applications"}
        cta={cta}
        contactLine={{ email: contact.email, phone: contact.phone }}
      />
      <main id="main" className="site-main flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} categories={categories} navItems={navItems} />
      {navigation.showWhatsAppButton && (
        <WhatsAppFloat phone={contact.whatsapp} message={contact.whatsappMessage || undefined} />
      )}
    </>
  );
}
