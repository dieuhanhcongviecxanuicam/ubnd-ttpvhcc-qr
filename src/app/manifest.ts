import type { MetadataRoute } from "next";
import { duongDan, SITE_CONFIG } from "@/lib/site-config";

/** Bắt buộc với output: "export" — báo Next đây là tệp sinh sẵn lúc build. */
export const dynamic = "force-static";

/**
 * Manifest PWA — cho phép cán bộ một cửa thêm trang vào màn hình chính điện thoại
 * và mở như một ứng dụng, không có thanh địa chỉ.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_CONFIG.tenDayDu,
    short_name: SITE_CONFIG.ten,
    description: SITE_CONFIG.moTa,
    lang: "vi",
    start_url: duongDan("/"),
    scope: duongDan("/"),
    display: "standalone",
    background_color: "#F1EEE4",
    theme_color: "#9B2226",
    icons: [
      { src: duongDan("/brand/icon-192.png"), sizes: "192x192", type: "image/png" },
      { src: duongDan("/brand/icon-512.png"), sizes: "512x512", type: "image/png" },
      {
        src: duongDan("/brand/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
