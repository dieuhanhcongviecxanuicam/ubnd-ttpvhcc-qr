/**
 * Phân nhóm 77 lĩnh vực thành 13 nhóm ngành, mỗi nhóm một màu và một hình minh hoạ.
 *
 * Vì sao cần: bảng niêm yết giấy tại bộ phận một cửa gom thủ tục theo nhóm ngành
 * (Đất đai, Xây dựng, Tư pháp - Hộ tịch...) và người dân đã quen nhận dạng theo
 * mảng màu đó. Danh sách phẳng 77 thẻ xám giống hệt nhau trên trang chủ bắt người
 * đọc phải dò từng chữ mới tìm được lĩnh vực cần. Nhóm + màu + hình minh hoạ cho
 * phép quét mắt theo khối trước, đọc chữ sau.
 *
 * Màu KHÔNG khai báo ở đây mà nằm trong globals.css (mục "Bảng màu nhóm lĩnh
 * vực"), tra theo thuộc tính `data-nhom`. Hai lý do: màu là chuyện trình bày, và
 * 77 thẻ mang `style=` nội tuyến sẽ phình HTML - trang này nhúng CSS thẳng vào
 * HTML nên mỗi byte đều lặp lại ba lần trong payload.
 *
 * Màu KHÔNG phải yếu tố nhận dạng duy nhất: mỗi thẻ vẫn có tên nhóm bằng chữ
 * (WCAG 1.4.1 "Use of Color").
 */

export interface NhomLinhVuc {
  id: string;
  /** Tên đầy đủ, hiển thị ở tiêu đề khối. */
  ten: string;
  /** Tên ngắn cho chip lọc và nhãn trên thẻ. */
  tenNgan: string;
  /** Tên tệp SVG trong /public/minh-hoa. */
  hinh: string;
}

/*
 * DỮ LIỆU nằm ở data/nhom-linh-vuc.json, không nằm ở đây.
 *
 * Chuyển ra JSON khi thêm mã QR cho cấp nhóm: pipeline Python sinh và kiểm chứng
 * mã QR (scripts/tao-ma-qr.py, scripts/kiem-tra-ma-qr.py) cần đúng danh sách id
 * nhóm, mà Python không đọc được TypeScript. Chép danh sách sang Python là tạo
 * ra hai nguồn sự thật - lệch nhau một lần là in ra mã QR trỏ tới trang không
 * tồn tại, đúng lớp lỗi nguy hiểm nhất của hệ thống. JSON đặt cạnh linh-vuc.json
 * vì nó cũng là dữ liệu danh mục, không phải mã.
 */
import duLieu from "../../data/nhom-linh-vuc.json" with { type: "json" };

export const NHOM_LINH_VUC: NhomLinhVuc[] = duLieu.nhom;

/**
 * Slug lĩnh vực -> id nhóm.
 *
 * Bảng khai báo tay chứ không đoán theo từ khoá trong tên: "An toàn đập, hồ chứa
 * thuỷ điện" thuộc thuỷ lợi (nông nghiệp) chứ không thuộc điện lực, còn "Đăng ký,
 * quản lý cư trú" đi cùng hộ tịch dù không mang chữ "tư pháp". Đoán theo chuỗi sẽ
 * xếp sai âm thầm; bảng tay sai thì test `tests/du-lieu.test.ts` chặn ngay.
 */
export const NHOM_CUA_LINH_VUC: Record<string, string> = duLieu.linh_vuc;

/**
 * Hình minh hoạ riêng của một số lĩnh vực, ghi đè hình mặc định của nhóm.
 *
 * Hình theo nhóm là đủ dùng, nhưng có những lĩnh vực mà hình nhóm nói sai hẳn:
 * "Biển và hải đảo" nằm chung nhóm Đất đai nên sẽ mang hình thửa ruộng, "Hàng
 * hải và đường thuỷ nội địa" mang hình đường bộ. Bảng này phủ những lĩnh vực đó
 * cùng phần lớn các lĩnh vực nhiều thủ tục nhất - chỗ người dân nhìn nhiều nhất.
 *
 * Màu bên trong hình là màu của chủ đề (biển xanh, rừng lục), không ăn theo màu
 * nhóm: hình vẽ nền trong suốt, nền màu do chính thẻ tô. Nhờ vậy một hình dùng
 * lại được cho lĩnh vực ở nhóm khác mà không lạc màu.
 */
export const HINH_RIENG: Record<string, string> = duLieu.hinh_rieng;

const THEO_ID = new Map(NHOM_LINH_VUC.map((n) => [n.id, n]));

/** Nhóm mặc định khi dữ liệu nguồn xuất hiện lĩnh vực mới chưa kịp xếp nhóm. */
export const NHOM_MAC_DINH = "khac";

/** Nhóm của một lĩnh vực theo slug - không bao giờ trả về undefined. */
export function nhomCuaLinhVuc(slug: string): NhomLinhVuc {
  const id = NHOM_CUA_LINH_VUC[slug] ?? NHOM_MAC_DINH;
  return THEO_ID.get(id) ?? THEO_ID.get(NHOM_MAC_DINH)!;
}

/** Tra nhóm theo id - dùng khi dựng khối và chip lọc. */
export function nhomTheoId(id: string): NhomLinhVuc | undefined {
  return THEO_ID.get(id);
}

/** Tên tệp hình minh hoạ của một lĩnh vực: hình riêng nếu có, không thì hình của nhóm. */
export function hinhCuaLinhVuc(slug: string): string {
  return HINH_RIENG[slug] ?? nhomCuaLinhVuc(slug).hinh;
}
