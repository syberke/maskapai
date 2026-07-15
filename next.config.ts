// next.config.ts
import { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development", // Mati di dev mode biar gak ganggu ngoding
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  /* Isikan konfigurasi bawaan projek kamu di sini jika sebelumnya sudah ada */
  output: "standalone",
  turbopack: {},
};

export default withPWA(nextConfig);