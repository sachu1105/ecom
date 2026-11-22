/**
 * Canonical site origin. Priority: NEXT_PUBLIC_SITE_URL → SEO setting →
 * Vercel production URL → localhost.
 */
export function getSiteUrl(settingUrl?: string | null): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    settingUrl,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      return url.origin;
    } catch {
      // ignore malformed values
    }
  }
  return "http://localhost:3000";
}

export function absoluteUrl(path: string, settingUrl?: string | null) {
  return new URL(path, getSiteUrl(settingUrl)).toString();
}
