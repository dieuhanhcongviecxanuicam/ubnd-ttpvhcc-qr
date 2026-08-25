/**
 * Cấu hình Next.js - chế độ static export để triển khai lên GitHub Pages.
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
  // URL không có dấu "/" ở cuối. Next xuất ra tệp dạng /linh-vuc/<slug>.html;
  // GitHub Pages tự phục vụ tệp đó cho đường dẫn /linh-vuc/<slug>.
  trailingSlash: false,
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,

  // Nhúng CSS thẳng vào HTML thay vì tải qua <link rel="stylesheet">.
  //
  // Vì sao: file CSS chặn hiển thị - trình duyệt phải tải xong nó mới vẽ được
  // gì. Trên mạng di động, một vòng yêu cầu thêm tốn cả trăm mili giây. Đo A/B
  // tại máy (7 lần xen kẽ, CPU 6x, mạng 1.6 Mbps) trên trang chi tiết TTHC:
  // FCP và LCP đều giảm 42%, từ 3512 ms xuống 2032 ms.
  //
  // Chi phí: Next nhúng CSS ba lần (một trong <style>, hai lần nữa trong
  // payload RSC) nên HTML thô phình từ 93 KB lên 211 KB. Nhưng brotli - thứ
  // Cloudflare đang dùng cho site này - khử trùng lặp rất tốt: lượt truy cập
  // đầu chỉ tăng 0,1 KB (16,5 -> 16,6 KB). Đây là kịch bản chính của site,
  // vì người dân quét mã QR để đọc một thủ tục rồi rời đi.
  //
  // Đánh đổi thật nằm ở người xem nhiều trang liên tiếp: CSS không còn được
  // cache dùng chung nữa nên mỗi trang sau tốn thêm khoảng 5,9 KB.
  experimental: { inlineCss: true },
};

export default nextConfig;
