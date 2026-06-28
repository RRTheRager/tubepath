import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@tubepath/ui", "@tubepath/core", "@tubepath/youtube", "@tubepath/ai"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
    ],
  },
};

export default nextConfig;
