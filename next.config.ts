import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      // Google user content (hotel images)
      { protocol: "https", hostname: "**.googleusercontent.com" },
      // TripAdvisor CDN
      { protocol: "https", hostname: "dynamic-media-cdn.tripadvisor.com" },
      { protocol: "https", hostname: "media-cdn.tripadvisor.com" },
      // Booking.com image CDNs
      { protocol: "https", hostname: "**.bstatic.com" },
      { protocol: "https", hostname: "**.booking.com" },
      // Agoda hotel images
      { protocol: "https", hostname: "**.agoda.net" },
      // Google static content (OTA brand logos, nearby place thumbnails)
      { protocol: "https", hostname: "**.gstatic.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Old auth routes → new /auth/* routes
      { source: "/login", destination: "/auth/login", permanent: true },
      { source: "/register", destination: "/auth/register", permanent: true },
      { source: "/forgot-password", destination: "/auth/forgot-password", permanent: true },
      // Old OAuth callback path
      { source: "/v1/auth/oauth/callback", destination: "/auth/oauth/callback", permanent: true },
    ];
  },
};

export default nextConfig;
