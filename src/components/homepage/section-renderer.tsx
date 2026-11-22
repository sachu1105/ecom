import type { HomepageSection } from "@/lib/validations/sections";
import type { SiteSettings } from "@/lib/validations/settings";
import type { Category, ProjectSummary } from "@/types/content";
import { HeroSection } from "./hero-section";
import { FeaturedProjectsSection } from "./featured-projects-section";
import { CategoryShowcaseSection } from "./category-showcase-section";
import { ImageTextSection } from "./image-text-section";
import { CampaignBannerSection } from "./campaign-banner-section";
import { VideoSection } from "./video-section";
import { BeforeAfterSection } from "./before-after-section";
import { IntroSection } from "./intro-section";
import { EnquiryCta } from "./enquiry-cta-section";

type RendererProps = {
  sections: HomepageSection[];
  featuredProjects: ProjectSummary[];
  categories: Category[];
  settings: SiteSettings;
};

/** Maps predefined homepage section types to their components. */
export function HomepageSections({ sections, featuredProjects, categories, settings }: RendererProps) {
  return (
    <>
      {sections.map((section, index) => {
        const isFirst = index === 0;
        switch (section.type) {
          case "hero":
            return <HeroSection key={section.id} content={section.content} settings={section.settings} isFirst={isFirst} />;
          case "featured_projects":
            return (
              <FeaturedProjectsSection
                key={section.id}
                content={section.content}
                settings={section.settings}
                projects={featuredProjects}
              />
            );
          case "category_showcase":
            return (
              <CategoryShowcaseSection
                key={section.id}
                content={section.content}
                settings={section.settings}
                categories={categories}
              />
            );
          case "image_text":
            return <ImageTextSection key={section.id} content={section.content} settings={section.settings} />;
          case "campaign_banner":
            return (
              <CampaignBannerSection key={section.id} content={section.content} settings={section.settings} isFirst={isFirst} />
            );
          case "video":
            return <VideoSection key={section.id} content={section.content} settings={section.settings} />;
          case "before_after":
            return <BeforeAfterSection key={section.id} content={section.content} settings={section.settings} />;
          case "intro":
            return <IntroSection key={section.id} content={section.content} settings={section.settings} />;
          case "enquiry_cta":
            return (
              <EnquiryCta
                key={section.id}
                eyebrow={section.content.eyebrow}
                heading={section.content.heading}
                body={section.content.body}
                cta={section.content.cta}
                theme={section.settings.theme}
                whatsapp={
                  section.content.showWhatsApp && settings.contact.whatsapp
                    ? { phone: settings.contact.whatsapp, message: settings.contact.whatsappMessage || undefined }
                    : null
                }
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}
