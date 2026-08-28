import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  reactCompiler: true,
  typedRoutes: true,
  poweredByHeader: false,
  transpilePackages: ["@b2b-crm/extension-sdk"],
};

export default nextConfig;
