import type { NextConfig } from "next";

const BACKEND_URL = (process.env.BACKEND_INTERNAL_URL || 'http://13.233.159.143/api').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;

