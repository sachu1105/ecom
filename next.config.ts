import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHost = supabaseUrl ? new URL(supabaseUrl) : null;
const isDev = process.env.NODE_ENV !== "production";
const isLocalSupabase =
  !!supabaseHost && ["localhost", "127.0.0.1"].includes(supabaseHost.hostname);

// The local Supabase stack (npm run local:start) always serves on port 54321.
// Allowing it in development means images work even if the dev server was
// started before .env.local existed.
const localSupabasePatterns = isDev
  ? (["127.0.0.1", "localhost"] as const).map((hostname) => ({
      protocol: "http" as const,
      hostname,
      port: "54321",
      pathname: "/storage/v1/object/public/**",
    }))
  : [];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75, 85],
    deviceSizes: [640, 750, 828, 1080, 1280, 1600, 1920, 2560],
    remotePatterns: [
      ...localSupabasePatterns,
      ...(supabaseHost
        ? [
            {
              protocol: supabaseHost.protocol.replace(":", "") as "http" | "https",
              hostname: supabaseHost.hostname,
              port: supabaseHost.port,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      // Optional demo content (supabase/seed/demo.sql). Keep in sync with
      // EXTERNAL_MEDIA_HOSTS in src/config/media.ts.
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    // Only needed when developing against a local Supabase stack.
    dangerouslyAllowLocalIP: isDev || isLocalSupabase,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
