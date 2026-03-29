import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "resume-bot-eight.vercel.app" }],
        destination: "https://resumebots.co/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        // Allow Firebase Auth popup to communicate back
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
