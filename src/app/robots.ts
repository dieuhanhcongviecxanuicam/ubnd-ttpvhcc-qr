import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-config";

/** Bắt buộc với output: "export" - báo Next đây là tệp sinh sẵn lúc build. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/in-ma-qr" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
