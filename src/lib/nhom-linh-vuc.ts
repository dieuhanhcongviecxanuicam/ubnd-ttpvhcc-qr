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

export const NHOM_LINH_VUC: NhomLinhVuc[] = [
  {
    id: "dat-dai",
    ten: "Đất đai và Tài nguyên - Môi trường",
    tenNgan: "Đất đai, Tài nguyên",
    hinh: "dat-dai.svg",
  },
  {
    id: "xay-dung",
    ten: "Xây dựng, Quy hoạch và Đô thị",
    tenNgan: "Xây dựng, Đô thị",
    hinh: "xay-dung.svg",
  },
  {
    id: "nong-nghiep",
    ten: "Nông nghiệp và Phát triển nông thôn",
    tenNgan: "Nông nghiệp",
    hinh: "nong-nghiep.svg",
  },
  {
    id: "tu-phap",
    ten: "Tư pháp - Hộ tịch",
    tenNgan: "Tư pháp, Hộ tịch",
    hinh: "tu-phap.svg",
  },
  {
    id: "lao-dong",
    ten: "Lao động, Người có công và Xã hội",
    tenNgan: "Lao động, Xã hội",
    hinh: "lao-dong.svg",
  },
  {
    id: "van-hoa",
    ten: "Văn hóa, Thể thao và Du lịch",
    tenNgan: "Văn hóa, Thể thao",
    hinh: "van-hoa.svg",
  },
  {
    id: "giao-duc",
    ten: "Giáo dục và Đào tạo",
    tenNgan: "Giáo dục",
    hinh: "giao-duc.svg",
  },
  {
    id: "y-te",
    ten: "Y tế và An toàn thực phẩm",
    tenNgan: "Y tế",
    hinh: "y-te.svg",
  },
  {
    id: "thong-tin",
    ten: "Thông tin và Truyền thông",
    tenNgan: "Thông tin, Truyền thông",
    hinh: "thong-tin.svg",
  },
  {
    id: "kinh-te",
    ten: "Kinh tế, Doanh nghiệp và Tài chính",
    tenNgan: "Kinh tế, Doanh nghiệp",
    hinh: "kinh-te.svg",
  },
  {
    id: "giao-thong",
    ten: "Giao thông vận tải",
    tenNgan: "Giao thông",
    hinh: "giao-thong.svg",
  },
  {
    id: "noi-vu",
    ten: "Nội vụ, Dân tộc và Tôn giáo",
    tenNgan: "Nội vụ, Dân tộc",
    hinh: "noi-vu.svg",
  },
  {
    id: "khac",
    ten: "Lĩnh vực khác",
    tenNgan: "Khác",
    hinh: "khac.svg",
  },
];

/**
 * Slug lĩnh vực -> id nhóm.
 *
 * Bảng khai báo tay chứ không đoán theo từ khoá trong tên: "An toàn đập, hồ chứa
 * thuỷ điện" thuộc thuỷ lợi (nông nghiệp) chứ không thuộc điện lực, còn "Đăng ký,
 * quản lý cư trú" đi cùng hộ tịch dù không mang chữ "tư pháp". Đoán theo chuỗi sẽ
 * xếp sai âm thầm; bảng tay sai thì test `tests/du-lieu.test.ts` chặn ngay.
 */
export const NHOM_CUA_LINH_VUC: Record<string, string> = {
  // Đất đai và Tài nguyên - Môi trường
  "dat-dai": "dat-dai",
  "tai-chinh-dat-dai": "dat-dai",
  "tai-nguyen-nuoc": "dat-dai",
  "dia-chat-va-khoang-san": "dat-dai",
  "moi-truong": "dat-dai",
  "bien-va-hai-dao": "dat-dai",
  "ung-pho-su-co-tran-dau-bqp": "dat-dai",

  // Xây dựng, Quy hoạch và Đô thị
  "hoat-dong-xay-dung": "xay-dung",
  "quan-ly-chat-luong-cong-trinh-xay-dung": "xay-dung",
  "quy-hoach-do-thi-va-nong-thon": "xay-dung",
  "ha-tang-ky-thuat": "xay-dung",
  "nha-o-va-cong-so": "xay-dung",

  // Nông nghiệp và Phát triển nông thôn
  "chan-nuoi": "nong-nghiep",
  "thu-y": "nong-nghiep",
  "trong-trot": "nong-nghiep",
  "trong-trot-va-bao-ve-thuc-vat": "nong-nghiep",
  "kiem-lam": "nong-nghiep",
  "lam-nghiep-va-kiem-lam": "nong-nghiep",
  "thuy-loi": "nong-nghiep",
  "thuy-san": "nong-nghiep",
  "an-toan-dap-ho-chua-thuy-dien": "nong-nghiep",
  "quan-ly-de-dieu-va-phong-chong-thien-tai": "nong-nghiep",
  "kinh-te-hop-tac-va-phat-trien-nong-thon": "nong-nghiep",
  "quan-ly-chat-luong-nong-lam-san-va-thuy-san": "nong-nghiep",
  "nong-nghiep-nong-nghiep": "nong-nghiep",

  // Tư pháp - Hộ tịch
  "ho-tich": "tu-phap",
  "chung-thuc": "tu-phap",
  "nuoi-con-nuoi": "tu-phap",
  "hoa-giai-o-co-so": "tu-phap",
  "boi-thuong-nha-nuoc": "tu-phap",
  "dang-ky-bien-phap-bao-dam": "tu-phap",
  "dang-ky-quan-ly-cu-tru": "tu-phap",

  // Lao động, Người có công và Xã hội
  "nguoi-co-cong": "lao-dong",
  "bao-tro-xa-hoi": "lao-dong",
  "giam-ngheo": "lao-dong",
  "viec-lam": "lao-dong",
  "lao-dong": "lao-dong",
  "lao-dong-tien-luong": "lao-dong",
  "quan-ly-lao-dong-ngoai-nuoc": "lao-dong",
  "an-toan-ve-sinh-lao-dong": "lao-dong",
  "bao-hiem-xa-hoi": "lao-dong",
  "tre-em": "lao-dong",
  "phong-chong-te-nan-xa-hoi": "lao-dong",
  "quan-ly-chuong-trinh-muc-tieu-quoc-gia": "lao-dong",

  // Văn hóa, Thể thao và Du lịch
  "van-hoa": "van-hoa",
  "di-san-van-hoa": "van-hoa",
  "the-duc-the-thao": "van-hoa",
  "gia-dinh": "van-hoa",

  // Giáo dục và Đào tạo
  "giao-duc-mam-non": "giao-duc",
  "giao-duc-tieu-hoc": "giao-duc",
  "giao-duc-trung-hoc": "giao-duc",
  "giao-duc-thuong-xuyen": "giao-duc",
  "giao-duc-nghe-nghiep-g07-ld06": "giao-duc",
  "giao-duc-va-dao-tao-thuoc-he-thong-giao-duc-quoc-dan": "giao-duc",
  "cac-co-so-giao-duc-khac": "giao-duc",
  "kiem-dinh-chat-luong-giao-duc": "giao-duc",
  "thi-tuyen-sinh": "giao-duc",

  // Y tế và An toàn thực phẩm
  "an-toan-thuc-pham": "y-te",

  // Thông tin và Truyền thông
  "phat-thanh-truyen-hinh-va-thong-tin-dien-tu": "thong-tin",
  "xuat-ban-in-va-phat-hanh": "thong-tin",

  // Kinh tế, Doanh nghiệp và Tài chính
  "thanh-lap-va-hoat-dong-doanh-nghiep-ho-kinh-doanh": "kinh-te",
  "thanh-lap-va-hoat-dong-cua-to-hop-tac-hop-tac-xa-lien-hiep-hop-tac-xa": "kinh-te",
  "thanh-lap-va-hoat-dong-cua-to-hop-tac-khong-dang-ky": "kinh-te",
  "ho-tro-to-hop-tac-hop-tac-xa-lien-hiep-hop-tac-xa": "kinh-te",
  "quan-ly-thue-phi-le-phi-va-thu-khac-cua-ngan-sach-nha-nuoc": "kinh-te",
  "hai-quan": "kinh-te",
  "tai-san-ket-cau-ha-tang-cho-do-nha-nuoc-dau-tu-quan-ly": "kinh-te",
  "bao-ve-quyen-loi-nguoi-tieu-dung": "kinh-te",
  "dien-luc": "kinh-te",

  // Giao thông vận tải
  "duong-bo": "giao-thong",
  "hang-hai-va-duong-thuy-noi-dia": "giao-thong",

  // Nội vụ, Dân tộc và Tôn giáo
  "cong-chuc-vien-chuc": "noi-vu",
  "thi-dua-khen-thuong": "noi-vu",
  "quan-ly-nha-nuoc-ve-hoi-quy": "noi-vu",
  "tin-nguong-ton-giao": "noi-vu",
  "cong-tac-dan-toc": "noi-vu",

  // Lĩnh vực khác
  "chua-phan-loai": "khac",
};

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
export const HINH_RIENG: Record<string, string> = {
  // Đất đai và Tài nguyên - Môi trường
  "bien-va-hai-dao": "bien-dao.svg",
  "ung-pho-su-co-tran-dau-bqp": "bien-dao.svg",
  "tai-nguyen-nuoc": "nuoc.svg",
  "moi-truong": "moi-truong.svg",
  "dia-chat-va-khoang-san": "khoang-san.svg",
  "tai-chinh-dat-dai": "thue.svg",

  // Xây dựng, Quy hoạch và Đô thị
  "nha-o-va-cong-so": "nha-o.svg",

  // Nông nghiệp và Phát triển nông thôn
  "thuy-loi": "thuy-loi.svg",
  "an-toan-dap-ho-chua-thuy-dien": "thuy-loi.svg",
  "quan-ly-de-dieu-va-phong-chong-thien-tai": "thuy-loi.svg",
  "thuy-san": "thuy-san.svg",
  "quan-ly-chat-luong-nong-lam-san-va-thuy-san": "thuy-san.svg",
  "chan-nuoi": "chan-nuoi.svg",
  "thu-y": "chan-nuoi.svg",
  "kiem-lam": "rung.svg",
  "lam-nghiep-va-kiem-lam": "rung.svg",

  // Tư pháp - Hộ tịch
  "ho-tich": "ho-tich.svg",
  "dang-ky-quan-ly-cu-tru": "ho-tich.svg",
  "chung-thuc": "chung-thuc.svg",
  "nuoi-con-nuoi": "tre-em.svg",

  // Lao động, Người có công và Xã hội
  "nguoi-co-cong": "huan-chuong.svg",
  "viec-lam": "viec-lam.svg",
  "lao-dong": "viec-lam.svg",
  "lao-dong-tien-luong": "viec-lam.svg",
  "quan-ly-lao-dong-ngoai-nuoc": "viec-lam.svg",
  "an-toan-ve-sinh-lao-dong": "viec-lam.svg",
  "tre-em": "tre-em.svg",

  // Văn hóa, Thể thao và Du lịch
  "di-san-van-hoa": "tin-nguong.svg",
  "the-duc-the-thao": "the-thao.svg",
  "gia-dinh": "tre-em.svg",

  // Kinh tế, Doanh nghiệp và Tài chính
  "thanh-lap-va-hoat-dong-doanh-nghiep-ho-kinh-doanh": "doanh-nghiep.svg",
  "thanh-lap-va-hoat-dong-cua-to-hop-tac-hop-tac-xa-lien-hiep-hop-tac-xa": "doanh-nghiep.svg",
  "thanh-lap-va-hoat-dong-cua-to-hop-tac-khong-dang-ky": "doanh-nghiep.svg",
  "ho-tro-to-hop-tac-hop-tac-xa-lien-hiep-hop-tac-xa": "doanh-nghiep.svg",
  "tai-san-ket-cau-ha-tang-cho-do-nha-nuoc-dau-tu-quan-ly": "doanh-nghiep.svg",
  "quan-ly-thue-phi-le-phi-va-thu-khac-cua-ngan-sach-nha-nuoc": "thue.svg",
  "hai-quan": "thue.svg",

  // Giao thông vận tải
  "duong-bo": "duong-bo.svg",
  "hang-hai-va-duong-thuy-noi-dia": "tau-thuy.svg",

  // Nội vụ, Dân tộc và Tôn giáo
  "thi-dua-khen-thuong": "huan-chuong.svg",
  "tin-nguong-ton-giao": "tin-nguong.svg",
};

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
