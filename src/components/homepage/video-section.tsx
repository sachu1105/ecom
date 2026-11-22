import { VideoPlayer } from "@/components/shared/video-player";
import { SectionHeading } from "@/components/shared/text-blocks";
import type { HomepageContent, HomepageSettings } from "@/lib/validations/sections";
import { cn } from "@/lib/utils";

export function VideoSection({
  content,
  settings,
}: {
  content: HomepageContent<"video">;
  settings: HomepageSettings<"video">;
}) {
  if (!content.video?.path) return null;
  const hasHeading = content.eyebrow || content.heading || content.body;
  return (
    <section className="section-y">
      {hasHeading && (
        <div className="container-site mb-10 md:mb-14">
          <SectionHeading eyebrow={content.eyebrow} heading={content.heading} description={content.body} />
        </div>
      )}
      <div className={cn(!settings.fullWidth && "container-site")}>
        <div className="relative aspect-[4/5] overflow-hidden bg-ink sm:aspect-video">
          <VideoPlayer
            src={content.video.path}
            poster={content.poster?.path}
            ambient={settings.autoplay}
            label={content.heading || "Project video"}
          />
        </div>
      </div>
    </section>
  );
}
