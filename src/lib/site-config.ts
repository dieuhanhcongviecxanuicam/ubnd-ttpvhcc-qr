/**
 * Cấu hình tập trung của hệ thống.
 *
 * Mọi giá trị phụ thuộc nơi triển khai đều đọc từ biến môi trường, để khi
 * chuyển từ GitHub Pages sang domain chính thức của đơn vị chỉ cần đổi biến
 * môi trường rồi chạy lại `npm run du-lieu:tao-qr` — không phải sửa mã nguồn.
 */

/**
 * Tiền tố đường dẫn. Rỗng vì hệ thống chạy trên tên miền riêng
 * (ttpvhcc.xanuicam.vn) phục vụ ngay từ gốc. Chỉ cần đặt biến này khi tạm
 * triển khai lên GitHub Pages dạng project site.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Gốc tên miền, không có dấu "/" ở cuối. */
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "https://ttpvhcc.xanuicam.vn";

/** URL đầy đủ của trang chủ — đây chính là địa chỉ được nhúng vào mã QR tổng. */
export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`;

export const SITE_CONFIG = {
  ten: "Tra cứu TTHC",
  tenDayDu: "Hệ thống tra cứu thủ tục hành chính qua mã QR",
  moTa:
    "Quét mã QR để tra cứu nhanh thủ tục hành chính theo từng lĩnh vực. " +
    "Liên kết trực tiếp tới Cổng Dịch vụ công Quốc gia.",
  donVi: "Trung tâm Phục vụ hành chính công",
  nguonDuLieu: "Cổng Dịch vụ công Quốc gia",
  nguonDuLieuUrl: "https://dichvucong.gov.vn",
} as const;

/** Ghép đường dẫn nội bộ với BASE_PATH — dùng cho tài nguyên tĩnh trong /public. */
export function duongDan(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${p}`;
}

/** URL tuyệt đối của một trang lĩnh vực — giá trị được mã hoá vào QR lĩnh vực. */
export function urlLinhVuc(slug: string): string {
  return `${SITE_URL}/linh-vuc/${slug}/`;
}
