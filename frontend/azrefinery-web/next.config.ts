import type { NextConfig } from "next";

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:5000";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["37.26.2.168", "192.168.5.66"],
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_ORIGIN}/api/:path*` },
      { source: "/hubs/:path*", destination: `${BACKEND_ORIGIN}/hubs/:path*` },
    ];
  },
};

export default nextConfig;
