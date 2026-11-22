import type { SocialPlatform } from "@/lib/validations/settings";

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.6l-4.5.9z" />
      <path d="M9 8.6c.2-.5.5-.6.8-.6h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.7l-.5.6c.6 1.2 1.6 2.2 2.8 2.8l.6-.5c.2-.2.5-.2.7-.1l1.6.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.6.8-1 .5-2.6.3-4.4-1.1-1.6-1.3-2.7-2.8-3-4-.2-.8-.1-1.4 0-1.8z" />
    </svg>
  );
}

const icons: Record<SocialPlatform, (p: IconProps) => React.ReactElement> = {
  instagram: ({ className }) => (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  ),
  facebook: ({ className }) => (
    <svg {...base} className={className}>
      <path d="M14.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8.9v3h2.6V21" />
    </svg>
  ),
  linkedin: ({ className }) => (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M8 10.5V16M8 7.6v.1M11.5 16v-5.5M11.5 13c0-1.6 1-2.6 2.3-2.6s2.2.9 2.2 2.6V16" />
    </svg>
  ),
  youtube: ({ className }) => (
    <svg {...base} className={className}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.5v5l4.2-2.5z" fill="currentColor" />
    </svg>
  ),
  tiktok: ({ className }) => (
    <svg {...base} className={className}>
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.4 2.4 2 4 4.5 4.3" />
    </svg>
  ),
  x: ({ className }) => (
    <svg {...base} className={className}>
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  ),
  pinterest: ({ className }) => (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10.6 20.5l1.7-7.3M10 13.8c.4 1 1.3 1.6 2.4 1.6 2.2 0 3.6-2 3.6-4.3 0-2.4-1.9-4.1-4.4-4.1-2.8 0-4.6 2-4.6 4.2 0 .9.3 1.7.9 2.1" />
    </svg>
  ),
  behance: ({ className }) => (
    <svg {...base} className={className}>
      <path d="M3 6.5h5a2.5 2.5 0 0 1 0 5H3zM3 11.5h5.5a2.75 2.75 0 0 1 0 5.5H3zM14.5 7.5h5M14 13.5h7a3.5 3.5 0 1 0-1 2.5" />
    </svg>
  ),
  website: ({ className }) => (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </svg>
  ),
};

export const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  pinterest: "Pinterest",
  behance: "Behance",
  website: "Website",
};

export function SocialIcon({ platform, className }: { platform: SocialPlatform; className?: string }) {
  const Icon = icons[platform];
  return <Icon className={className} />;
}
