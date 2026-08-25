import type { MetadataRoute } from "next";
import { layTatCaLinhVuc, layTatCaTthc } from "@/lib/data";
import { SITE_URL } from "@/lib/site-config";

/** Bắt buộc với output: "export" - báo Next đây là tệp sinh sẵn lúc build. */
export const dynamic = "force-static";

/** Sitemap tĩnh gồm trang chủ, danh mục, 77 trang lĩnh vực và toàn bộ trang chi tiết. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/danh-muc`, lastModified: now, priority: 0.9 },
    ...layTatCaLinhVuc().map((lv) => ({
      url: `${SITE_URL}/linh-vuc/${lv.slug}`,
      lastModified: now,
      priority: 0.8,
    })),
    ...layTatCaTthc().map((t) => ({
      url: `${SITE_URL}/tthc/${t.ma_tthc}`,
      lastModified: now,
      priority: 0.6,
    })),
  ];
}
