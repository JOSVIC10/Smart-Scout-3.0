import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 't.resfu.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.resfu.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'mnfxjxorffxnuxpdzzzd.supabase.co',
      }
    ],
  },
};

export default nextConfig;
