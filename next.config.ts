import type { NextConfig } from "next";
// @ts-ignore
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  turbopack: {},
};

export default withPWA({
  dest: "public",
})(nextConfig as any);
