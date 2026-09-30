import type { NextConfig } from "next"; // 👈 Fully supported in .mts format
import { networkInterfaces } from "node:os";

const localDevOrigins = Object.values(networkInterfaces())
  .flatMap((addresses) => addresses ?? [])
  .filter((address) => address.family === "IPv4" && !address.internal)
  .map((address) => address.address);

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", ...localDevOrigins],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  turbopack: {
    // 👈 Locks Turbopack to your absolute project folder path context
    root: "C:\\Users\\jeban\\Infinideo",
  },
};

export default nextConfig;
