/**
 * Đọc thông tin tệp trong public/ lúc build để dựng cửa sổ xem trước khi tải.
 *
 * Chạy phía máy chủ vì cần filesystem; trình duyệt chỉ nhận về vài chuỗi đã tính
 * sẵn (dung lượng, kích thước ảnh), không phải tự tải tệp về để đo.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { duongDan } from "./site-config";
import type { DuLieuTaiVe, ThongTinTep } from "./types";

const THU_MUC_PUBLIC = path.join(process.cwd(), "public");

/** "2,6 KB" - định dạng số kiểu Việt Nam, dấu phẩy thập phân. */
export function dungLuong(soByte: number): string {
  if (soByte < 1024) return `${soByte} B`;
  const kb = soByte / 1024;
  if (kb < 1024) return `${kb.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} KB`;
  return `${(kb / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`;
}

/** Đọc chiều rộng × cao từ khối IHDR của PNG, không cần thư viện xử lý ảnh. */
function kichThuocPng(duLieu: Buffer): [number, number] | null {
  const CHU_KY = "89504e470d0a1a0a";
  if (duLieu.length < 24 || duLieu.subarray(0, 8).toString("hex") !== CHU_KY) return null;
  return [duLieu.readUInt32BE(16), duLieu.readUInt32BE(20)];
}

/**
 * Dữ liệu cửa sổ xem trước cho một tệp mã QR.
 *
 * Dòng "Mã QR mở tới" là phần đã chuyển về đây từ hộp "Trước khi in" cũ của
 * trang /in-ma-qr: người sắp in cần biết mã trỏ tới địa chỉ nào, và nơi đúng để
 * nói điều đó là ngay cạnh nút tải, không phải một hộp cảnh báo đầu trang.
 */
export function thongTinTepQr(
  duongDanPublic: string,
  urlTrongMa: string,
  tieuDe: string,
): DuLieuTaiVe {
  const duLieu = fs.readFileSync(path.join(THU_MUC_PUBLIC, duongDanPublic));
  const laSvg = duongDanPublic.endsWith(".svg");

  const thongTin: ThongTinTep[] = [
    { nhan: "Mã QR mở tới", giaTri: urlTrongMa },
    {
      nhan: "Định dạng",
      giaTri: laSvg
        ? "SVG - vector, phóng to không vỡ nét, hợp cho in khổ lớn"
        : "PNG - ảnh điểm, hợp cho in khổ A4 và chèn vào văn bản",
    },
  ];
  const kichThuoc = laSvg ? null : kichThuocPng(duLieu);
  if (kichThuoc) {
    thongTin.push({ nhan: "Kích thước", giaTri: `${kichThuoc[0]} × ${kichThuoc[1]} px` });
  }
  thongTin.push({ nhan: "Dung lượng", giaTri: dungLuong(duLieu.length) });

  return {
    href: duongDan(duongDanPublic),
    tenTep: `ttpvhcc-${path.basename(duongDanPublic)}`,
    tieuDe,
    anhXemTruoc: duongDan(duongDanPublic),
    thongTin,
    ghiChu: "Quét thử bằng camera điện thoại trước khi in hàng loạt.",
  };
}
