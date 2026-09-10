import type { NextConfig } from "next";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:5000";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["devhmps.ilmeee.com"],

  // Proxy the Rust API through this app's own origin. The browser may sit on a
  // public HTTPS host (tunnel/production) while the API listens on localhost —
  // Chrome blocks those cross-origin calls to a private address, and preflighted
  // requests (admin endpoints send Authorization) fail outright with
  // "Failed to fetch". Same-origin paths sidestep CORS and mixed content, and
  // uploaded media keeps working for every visitor, not just the local machine.
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${API_ORIGIN}/api/v1/:path*` },
      { source: "/storage/:path*", destination: `${API_ORIGIN}/storage/:path*` },
    ];
  },
};

export default nextConfig;
