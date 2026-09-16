/**
 * Ba bản in dựng sẵn thành PDF lúc triển khai.
 *
 * Nguồn duy nhất cho route, tên tệp và khổ giấy - dùng chung giữa trang
 * /in-ma-qr (hiện nút tải) và scripts/dung-ban-in.ts (dựng tệp). Hai nơi mà
 * khai báo riêng thì sớm muộn nút tải sẽ trỏ tới một tệp không ai dựng.
 */
export interface BanIn {
  id: "bang-niem-yet" | "to-nhom" | "tem-ma-qr";
  ten: string;
  /** Trang HTML dùng làm nguồn dựng PDF - cũng là bản xem trước toàn trang. */
  route: string;
  /** Tên tệp không đuôi, đặt trong THU_MUC_BAN_IN. */
  tep: string;
  khoGiay: string;
  rongMm: number;
  caoMm: number;
  ghiChu: string;
}

export const THU_MUC_BAN_IN = "/ban-in";

export const BAN_IN: readonly BanIn[] = [
  {
    id: "bang-niem-yet",
    ten: "Bảng niêm yết tổng",
    route: "/in-ma-qr/bang-niem-yet",
    tep: "ttpvhcc-bang-niem-yet-a1",
    khoGiay: "A1 ngang",
    rongMm: 841,
    caoMm: 594,
    ghiChu:
      "Tệp vector: in A1 ở tỉ lệ 100%, hoặc phóng A0 mà không vỡ nét vì A0 và A1 cùng tỉ lệ. Quét thử vài mã trước khi in bạt.",
  },
  {
    id: "to-nhom",
    ten: "Tờ niêm yết theo nhóm",
    route: "/in-ma-qr/to-nhom",
    tep: "ttpvhcc-to-nhom-a4",
    khoGiay: "A4 dọc",
    rongMm: 210,
    caoMm: 297,
    ghiChu: "Trong hộp thoại in, chọn khổ A4 và tỉ lệ 100% (Actual size), không chọn 'Vừa trang'.",
  },
  {
    id: "tem-ma-qr",
    ten: "Tem mã QR cỡ lớn",
    route: "/in-ma-qr/tem-ma-qr",
    tep: "ttpvhcc-tem-ma-qr-a4",
    khoGiay: "A4 dọc",
    rongMm: 210,
    caoMm: 297,
    ghiChu: "Trong hộp thoại in, chọn khổ A4 và tỉ lệ 100% (Actual size). Có thể chỉ in các trang cần dùng.",
  },
];

export function banIn(id: BanIn["id"]): BanIn {
  const b = BAN_IN.find((x) => x.id === id);
  if (!b) throw new Error(`Không có bản in ${id}`);
  return b;
}

export const tenTepPdf = (b: BanIn) => `${b.tep}.pdf`;
/** Ảnh xem trước trang đầu, chụp cùng lúc dựng PDF - cửa sổ xem trước hiện ảnh này. */
export const tenTepAnh = (b: BanIn) => `${b.tep}.jpg`;
