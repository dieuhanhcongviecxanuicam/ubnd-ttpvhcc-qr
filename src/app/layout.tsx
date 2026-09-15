import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import SiteHeader from "@/components/SiteHeader";
import { duongDan, SITE_CONFIG, SITE_URL } from "@/lib/site-config";
import "./globals.css";

/**
 * Bộ chữ tự host, mỗi họ MỘT file phủ trọn latin và tiếng Việt.
 *
 * Trước đây dùng next/font/google. Nó cũng tự host lúc build, nhưng giữ nguyên
 * cách Google cắt bộ chữ theo `unicode-range`: dấu tiếng Việt nằm ở file khác
 * với chữ cái không dấu, nên chữ "Giải" phải tạo hình bằng hai file font. Đo
 * được (docs/HIEU-NANG.md mục 4): chữ có dấu đắt hơn chữ bỏ dấu 49,6% với bộ
 * chữ bị chia, so với 17,9% khi phủ trọn trong một face.
 *
 * Đổi sang một file mỗi họ: 251 KB / 12 file còn 184,5 KB / 4 file, và phần
 * @font-face nhúng vào mỗi trang giảm từ 62 khai báo (21,9 KB) còn 4.
 *
 * File sinh bằng scripts/tao-bo-chu.py và đã commit, nên build và CI không cần
 * mạng. scripts/kiem-tra-bo-chu.py canh cho bộ chữ luôn phủ hết ký tự trong
 * dữ liệu.
 */
const lora = localFont({
  src: "../fonts/lora-viet.woff2",
  weight: "600 700",
  style: "normal",
  variable: "--font-lora",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const inter = localFont({
  src: "../fonts/inter-viet.woff2",
  weight: "400 700",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
  fallback: ["-apple-system", "Segoe UI", "sans-serif"],
});

/**
 * Chữ mono dựng mã thủ tục, URL và số đếm.
 *
 * Là Chivo Mono chứ không phải IBM Plex Mono như trước: số 0 của Plex có một
 * CHẤM ở giữa - với người viết mã thì đó là tính năng phân biệt 0 với O, nhưng
 * trên bảng niêm yết hành chính, mã thủ tục "3.000442" hiện ra như bị lỗi phông.
 * Plex không có biến thể số 0 trơn để bật bằng `font-feature-settings`, nên phải
 * đổi họ chữ. Lý do chọn Chivo Mono ghi ở scripts/tao-bo-chu.py.
 *
 * Chivo Mono là bộ chữ biến thiên nên MỘT file phủ cả 500 lẫn 600, thay cho hai
 * file tĩnh của Plex.
 */
const chivoMono = localFont({
  src: "../fonts/chivo-mono-viet.woff2",
  weight: "500 600",
  style: "normal",
  variable: "--font-chivo-mono",
  display: "swap",
  fallback: ["Courier New", "monospace"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_CONFIG.tenDayDu}`,
    template: `%s - ${SITE_CONFIG.ten}`,
  },
  description: SITE_CONFIG.moTa,
  applicationName: SITE_CONFIG.tenDayDu,
  authors: [{ name: SITE_CONFIG.donVi }],
  keywords: [
    "thủ tục hành chính",
    "TTHC",
    "mã QR",
    "dịch vụ công",
    "hành chính công",
    "tra cứu TTHC",
  ],
  icons: {
    icon: [
      { url: duongDan("/favicon.ico"), sizes: "48x48" },
      { url: duongDan("/brand/favicon-32x32.png"), type: "image/png", sizes: "32x32" },
      { url: duongDan("/brand/favicon-16x16.png"), type: "image/png", sizes: "16x16" },
    ],
    apple: [{ url: duongDan("/brand/apple-touch-icon.png"), sizes: "180x180" }],
  },
  manifest: duongDan("/manifest.webmanifest"),
  appleWebApp: { capable: true, title: SITE_CONFIG.ten, statusBarStyle: "default" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: SITE_CONFIG.ten,
    title: SITE_CONFIG.tenDayDu,
    description: SITE_CONFIG.moTa,
    images: [
      {
        url: duongDan("/brand/logo-512.png"),
        width: 512,
        height: 512,
        alt: SITE_CONFIG.tenDayDu,
      },
    ],
  },
  twitter: { card: "summary", images: [duongDan("/brand/logo-512.png")] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#9B2226",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="vi"
      className={`${lora.variable} ${inter.variable} ${chivoMono.variable}`}
    >
      <body>
        <a className="bo-qua-dieu-huong" href="#noi-dung">
          Bỏ qua điều hướng, tới nội dung chính
        </a>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
