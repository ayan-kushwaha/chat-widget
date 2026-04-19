import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false, // Disabled to save RAM (Experimental)
  productionBrowserSourceMaps: false, // Disable source maps in production
  poweredByHeader: false,
  compress: true,
  output: "standalone", // Docker Optimization
  devIndicators: false, // Disable the Next.js 'N' dev toolbar (shown in dev mode)

  webpack: (config) => {
    config.plugins = config.plugins || [];
    config.plugins.push(
      new (require("webpack").DefinePlugin)({
        __VERSION__: JSON.stringify("novel-1.0.2"),
      }),
    );
    return config;
  },

  turbopack: {},

  // Optimize for lower memory usage in dev
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "assets.aceternity.com",
      },
      {
        // ✅ Google Profile Photos (OAuth)
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        // ✅ Google user content (alternate)
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*', // Look for local API route first
      },
      // 🟢 AI Engine Proxy
      {
        source: '/api/ai-engine/:path*',
        destination: 'http://127.0.0.1:5000/api/v1/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:4000/v1/:path*', // Proxy everything else to Backend
      },
      // 🟢 Add specific proxy for payment if needed, but the catch-all above works if auth is excluded
      {
        source: '/static/uploads/:path*',
        destination: 'http://localhost:5000/static/uploads/:path*', // AI Engine local storage
      },
    ];
  },
};

export default nextConfig;
