/**
 * Tiện ích xử lý chuỗi tiếng Việt - dùng chung giữa build-time và client.
 */

/**
 * Bỏ dấu tiếng Việt và chuyển về chữ thường, để người dân gõ "ho tich"
 * vẫn tìm được "Hộ tịch".
 */
export function boDau(chuoi: string | null | undefined): string {
  return (chuoi ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

/** Chuyển tên tiếng Việt thành slug URL - khớp với slugify() trong pipeline Python. */
export function taoSlug(chuoi: string): string {
  return boDau(chuoi)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
