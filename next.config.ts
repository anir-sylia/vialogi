import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

/** Server Actions default body limit is 1MB; parcel photos + multipart need more. Keep ≤4MB so Vercel (4.5MB hard cap) still accepts the request. */
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
