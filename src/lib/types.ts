/**
 * Kiểu dữ liệu cho danh mục thủ tục hành chính.
 * Tên trường giữ nguyên theo dữ liệu nguồn (Cổng Dịch vụ công Quốc gia)
 * để pipeline Python và frontend dùng chung một hợp đồng dữ liệu.
 */

export interface CachThucThucHien {
  hinh_thuc_nop: string;
  thoi_gian: string;
  phi_le_phi: string;
  mo_ta: string;
}

export interface TrinhTuThucHien {
  truong_hop_xu_ly: string;
  mo_ta_chi_tiet: string;
}

export interface ThanhPhanHoSo {
  ma_tphs: string;
  ten_giay_to: string;
  loai_giay_to: string;
  co_quan_ban_hanh: string;
  ban_chinh: boolean;
  ban_sao: boolean;
  bm_dien_tu: string;
}

export interface KetQuaThucHien {
  ma_ket_qua: string;
  ten_ket_qua: string;
  co_quan_ban_hanh: string;
  mo_ta: string;
}

export interface CanCuPhapLy {
  so_ky_hieu: string;
  trich_yeu: string;
  co_quan_ban_hanh: string;
  ngay_ban_hanh: string;
  ngay_hieu_luc: string;
  dia_chi_truy_cap: string;
}

export interface Tthc {
  stt: string;
  ma_tthc: string;
  ten_tthc: string;
  link_truy_cap: string;
  so_quyet_dinh: string;
  ngay_quyet_dinh: string;
  co_quan_ban_hanh: string;
  linh_vuc: string;
  cap_thuc_hien: string;
  doi_tuong_thuc_hien: string;
  loai_tthc: string;
  tu_khoa: string;
  dia_chi_tiep_nhan: string;
  co_quan_thuc_hien: string;
  co_quan_co_tham_quyen: string;
  co_quan_phoi_hop: string;
  co_quan_duoc_uy_quyen: string;
  mo_ta: string;
  trang_thai: string;
  yeu_cau_dieu_kien?: string;
  cach_thuc_thuc_hien?: CachThucThucHien[];
  trinh_tu_thuc_hien?: TrinhTuThucHien[];
  tphs?: ThanhPhanHoSo[];
  kqth?: KetQuaThucHien[];
  ccpl?: CanCuPhapLy[];
}

export interface LinhVuc {
  ten_linh_vuc: string;
  slug: string;
  so_luong_tthc: number;
  danh_sach_ma_tthc: string[];
}

export interface Meta {
  tong_so_tthc: number;
  tong_so_linh_vuc: number;
  ngay_xuat: string;
  nguon: string;
}

/**
 * Bản rút gọn của TTHC, chỉ giữ các trường cần cho tìm kiếm/hiển thị danh sách.
 * Đây là thứ được gửi xuống trình duyệt — thay vì toàn bộ 5,3 MB dữ liệu chi tiết.
 */
export interface TthcTomTat {
  ma_tthc: string;
  ten_tthc: string;
  linh_vuc: string;
  slug_linh_vuc: string;
  cap_thuc_hien: string;
  /** Chuỗi đã bỏ dấu, dựng sẵn lúc build để lọc phía client không phải xử lý lại. */
  tim_kiem: string;
}
