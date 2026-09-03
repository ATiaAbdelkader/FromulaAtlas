import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TS errors are now clean (0 errors) — removed ignoreBuildErrors
  // to let Vercel CI catch real type regressions
  reactStrictMode: false,
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
  // Redirect the old /landing route to / (landing is now the root route).
  async redirects() {
    return [
      {
        source: "/landing",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
