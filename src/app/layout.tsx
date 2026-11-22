import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getSiteSettings } from "@/lib/content/queries";
import { resolveMediaUrl } from "@/lib/content/media";
import { getSiteUrl } from "@/lib/utils/site";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { brand, seo } = await getSiteSettings();
  const siteUrl = getSiteUrl(seo.siteUrl);
  const defaultTitle = seo.defaultTitle || brand.name;
  const template = seo.titleTemplate?.includes("%s") ? seo.titleTemplate : `%s | ${brand.name}`;
  const ogImage = resolveMediaUrl(seo.ogImage?.path);

  return {
    metadataBase: new URL(siteUrl),
    title: { default: defaultTitle, template },
    description: seo.description || brand.tagline || undefined,
    applicationName: brand.name,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: brand.name,
      title: defaultTitle,
      description: seo.description || undefined,
      url: siteUrl,
      images: ogImage ? [{ url: ogImage, alt: seo.ogImage?.alt || brand.name }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: defaultTitle,
      description: seo.description || undefined,
      images: ogImage ? [ogImage] : undefined,
    },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  themeColor: "#f7f5f1",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
