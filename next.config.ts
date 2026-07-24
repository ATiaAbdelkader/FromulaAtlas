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
  // ESLint config is no longer supported in next.config.ts (Next.js 16+).
  // To skip lint during builds, use `--no-lint` flag or .eslintignore.
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
