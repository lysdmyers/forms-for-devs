const repo = "forms-for-devs";
const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use export/basePath/assetPrefix when building for GitHub Pages.
  ...(isProd
    ? {
        output: "export",
        trailingSlash: true,
        basePath: `/${repo}`,
        assetPrefix: `/${repo}/`,
      }
    : {}),
};

export default nextConfig;
