import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Photos travel to Blob storage inside a server action, whose body
      // defaults to 1MB — small enough that a plain phone photo fails. Vercel's
      // own request cap for a serverless function is 4.5MB, so raise it to just
      // under that; anything larger has to go in through
      // `scripts/import-press-photos.ts`, which uploads to Blob directly.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
