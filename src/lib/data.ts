/**
 * Truy xuất dữ liệu TTHC - CHỈ chạy lúc build (server component / SSG).
 *
 * Toàn bộ dữ liệu chi tiết (~5,3 MB) được đọc tại đây và render sẵn thành HTML
 * tĩnh. Trình duyệt người dân không bao giờ phải tải file JSON lớn này - đó là
 * khác biệt then chốt so với bản MVP tĩnh trước đây.
 */
import "server-only";
import fs from "node:fs";
import path from "node:path";
import { boDau } from "./text";
import type { LinhVuc, Meta, Tthc, TthcTomTat } from "./types";

const THU_MUC_DU_LIEU = path.join(process.cwd(), "data");

/**
 * Tên nhóm dành cho thủ tục chưa được gán lĩnh vực trong dữ liệu nguồn.
 * Phải khớp đúng chuỗi mà scripts/trich-xuat-du-lieu.py dùng khi gom nhóm.
 */
export const LINH_VUC_CHUA_PHAN_LOAI = "Chưa phân loại";

/** Tên lĩnh vực hiển thị của một thủ tục, chuẩn hoá trường hợp bỏ trống. */
export function tenLinhVucCua(t: Tthc): string {
  return (t.linh_vuc || "").trim() || LINH_VUC_CHUA_PHAN_LOAI;
}

function docJSON<T>(tenFile: string): T {
  const duongDan = path.join(THU_MUC_DU_LIEU, tenFile);
  return JSON.parse(fs.readFileSync(duongDan, "utf-8")) as T;
}

/**
 * Đọc một lần rồi giữ trong bộ nhớ tiến trình build. Nếu không cache, việc
 * pre-render 376 trang chi tiết sẽ phải parse lại file 5,3 MB mỗi trang.
 */
let _cache: {
  tthc: Tthc[];
  linhVuc: LinhVuc[];
  meta: Meta;
  theoMa: Map<string, Tthc>;
  theoSlugLinhVuc: Map<string, LinhVuc>;
  slugTheoTenLinhVuc: Map<string, string>;
} | null = null;

function nap() {
  if (_cache) return _cache;

  const tthc = docJSON<Tthc[]>("tthc.json");
  const linhVuc = docJSON<LinhVuc[]>("linh-vuc.json");
  const meta = docJSON<Meta>("meta.json");

  _cache = {
    tthc,
    linhVuc,
    meta,
    theoMa: new Map(tthc.map((t) => [t.ma_tthc, t])),
    theoSlugLinhVuc: new Map(linhVuc.map((lv) => [lv.slug, lv])),
    slugTheoTenLinhVuc: new Map(linhVuc.map((lv) => [lv.ten_linh_vuc, lv.slug])),
  };
  return _cache;
}

export function layMeta(): Meta {
  return nap().meta;
}

export function layTatCaLinhVuc(): LinhVuc[] {
  return nap().linhVuc;
}

export function layLinhVucTheoSlug(slug: string): LinhVuc | undefined {
  return nap().theoSlugLinhVuc.get(slug);
}

export function laySlugLinhVuc(tenLinhVuc: string): string | undefined {
  return nap().slugTheoTenLinhVuc.get(tenLinhVuc);
}

export function layTatCaTthc(): Tthc[] {
  return nap().tthc;
}

export function layTthcTheoMa(ma: string): Tthc | undefined {
  return nap().theoMa.get(ma);
}

/** Rút gọn một TTHC về bản tóm tắt gửi xuống client cho chức năng tìm kiếm. */
function tomTat(t: Tthc): TthcTomTat {
  const ten_linh_vuc = tenLinhVucCua(t);
  return {
    ma_tthc: t.ma_tthc,
    ten_tthc: t.ten_tthc,
    linh_vuc: ten_linh_vuc,
    slug_linh_vuc: laySlugLinhVuc(ten_linh_vuc) ?? "",
    cap_thuc_hien: t.cap_thuc_hien,
    // Dựng sẵn chuỗi không dấu lúc build để lọc phía client chạy tức thì.
    tim_kiem: boDau(`${t.ma_tthc} ${t.ten_tthc} ${ten_linh_vuc} ${t.tu_khoa}`),
  };
}

/** Toàn bộ 376 TTHC ở dạng tóm tắt - khoảng 90 KB thay vì 5,3 MB. */
export function layChiMucTimKiem(): TthcTomTat[] {
  return nap().tthc.map(tomTat);
}

/**
 * Danh sách TTHC thuộc một lĩnh vực, dạng tóm tắt.
 *
 * Lấy theo `danh_sach_ma_tthc` của chính lĩnh vực đó chứ không lọc theo tên.
 * Lọc theo tên từng gây lỗi: 7 thủ tục được gom vào nhóm "Chưa phân loại" nhưng
 * trường `linh_vuc` của chúng để rỗng, nên không bản ghi nào khớp và trang lĩnh
 * vực hiện "7 thủ tục" mà danh sách trống. Dùng chung một nguồn thì số đếm và
 * danh sách không thể lệch nhau nữa.
 */
export function layTthcTheoLinhVuc(lv: LinhVuc): TthcTomTat[] {
  const { theoMa } = nap();
  return lv.danh_sach_ma_tthc
    .map((ma) => theoMa.get(ma))
    .filter((t): t is Tthc => t !== undefined)
    .map(tomTat);
}

/** Các cấp thực hiện có trong dữ liệu - dùng dựng bộ lọc trang danh mục. */
export function layDanhSachCapThucHien(): string[] {
  const tap = new Set<string>();
  for (const t of nap().tthc) {
    for (const cap of (t.cap_thuc_hien || "").split(",")) {
      const c = cap.trim();
      if (c) tap.add(c);
    }
  }
  return [...tap].sort((a, b) => a.localeCompare(b, "vi"));
}
