/**
 * Cấu hình Next.js — chế độ static export để triển khai lên GitHub Pages.
 *
 * basePath: khi chạy trên GitHub Pages dạng project site, trang được phục vụ tại
 * https://<user>.github.io/<repo>/ nên toàn bộ đường dẫn phải có tiền tố /<repo>.
 * Khi chuyển sang domain riêng (vd tthc.angiang.gov.vn) chỉ cần bỏ biến môi trường
 * NEXT_PUBLIC_BASE_PATH là mọi thứ tự trở về gốc "/".
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  // Sinh ra thư mục dạng /linh-vuc/<slug>/index.html — bắt buộc để URL đẹp
  // nhúng trong mã QR hoạt động trên static hosting.
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
