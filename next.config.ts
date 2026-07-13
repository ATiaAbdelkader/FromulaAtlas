import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: `output: "standalone"` is removed for Vercel compatibility.
  // Vercel's Next.js preset expects the standard `.next` output, not the
  // standalone bundle. If deploying via Docker, re-add `output: "standalone"`
  // and use a Dockerfile that copies `.next/standalone/`.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
