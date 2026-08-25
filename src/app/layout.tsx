import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Lora } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import { SITE_CONFIG, SITE_URL } from "@/lib/site-config";
import "./globals.css";

/**
 * Font được tải sẵn và tự host lúc build (next/font) thay vì gọi Google Fonts
 * lúc chạy — trang hiển thị được cả khi mạng nội bộ chặn Internet, và không
 * còn hiện tượng nhảy chữ khi tải.
 */
const lora = Lora({
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  variable: "--font-lora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_CONFIG.tenDayDu}`,
    template: `%s — ${SITE_CONFIG.ten}`,
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
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: SITE_CONFIG.ten,
    title: SITE_CONFIG.tenDayDu,
    description: SITE_CONFIG.moTa,
  },
  twitter: { card: "summary" },
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
      className={`${lora.variable} ${inter.variable} ${plexMono.variable}`}
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
