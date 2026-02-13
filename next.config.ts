import type { NextConfig } from "next";

const repo = "forms-for-devs";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: `/${repo}`,
  assetPrefix: `/${repo}/`,
};

export default nextConfig;