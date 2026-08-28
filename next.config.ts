import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  transpilePackages: ["@spentacrm/extension-sdk"],
};

export default nextConfig;
