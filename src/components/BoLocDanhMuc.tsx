"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { boDau } from "@/lib/text";
import type { LinhVuc, TthcTomTat } from "@/lib/types";
import DongTthc from "./DongTthc";
import IconTimKiem from "./IconTimKiem";

const MOI_TRANG = 50;

/**
 * Tra cứu toàn bộ danh mục: tìm không dấu theo tên/mã/từ khoá, lọc theo lĩnh vực
 * và cấp thực hiện. Dữ liệu nhận vào là bản tóm tắt (~90 KB) đã dựng sẵn lúc build.
 */
export default function BoLocDanhMuc({
  danhSach,
  danhSachLinhVuc,
  danhSachCap,
}: {
  danhSach: TthcTomTat[];
  danhSachLinhVuc: LinhVuc[];
  danhSachCap: string[];
}) {
  const searchParams = useSearchParams();
  const [linhVuc, setLinhVuc] = useState("");
  const [cap, setCap] = useState("");

  // Từ khoá đến từ ô tìm kiếm trên thanh điều hướng (?q=...). Trang được xuất
  // tĩnh nên giá trị này chỉ có sau khi hydrate - dùng mẫu "điều chỉnh state khi
  // giá trị ngoài thay đổi" của React thay vì useEffect + setState.
  const tuKhoaUrl = searchParams.get("q") ?? "";
  const [tuKhoaUrlTruoc, setTuKhoaUrlTruoc] = useState(tuKhoaUrl);
  const [tuKhoa, setTuKhoa] = useState(tuKhoaUrl);
  if (tuKhoaUrl !== tuKhoaUrlTruoc) {
    setTuKhoaUrlTruoc(tuKhoaUrl);
    setTuKhoa(tuKhoaUrl);
  }

  const ketQua = useMemo(() => {
    const q = boDau(tuKhoa.trim());
    return danhSach.filter((t) => {
      if (linhVuc && t.linh_vuc !== linhVuc) return false;
      if (cap && !t.cap_thuc_hien.includes(cap)) return false;
      if (q && !t.tim_kiem.includes(q)) return false;
      return true;
    });
  }, [danhSach, tuKhoa, linhVuc, cap]);

  // Mỗi lần đổi điều kiện lọc thì quay về trang đầu.
  const khoaLoc = `${tuKhoa}\u0000${linhVuc}\u0000${cap}`;
  const [khoaLocTruoc, setKhoaLocTruoc] = useState(khoaLoc);
  const [soHien, setSoHien] = useState(MOI_TRANG);
  if (khoaLoc !== khoaLocTruoc) {
    setKhoaLocTruoc(khoaLoc);
    setSoHien(MOI_TRANG);
  }

  const dangLoc = Boolean(tuKhoa || linhVuc || cap);

  function xoaLoc() {
    setTuKhoa("");
    setLinhVuc("");
    setCap("");
  }

  return (
    <>
      <div className="o-tim-lon">
        <IconTimKiem size={18} />
        <label htmlFor="tim-chinh" className="bo-qua-dieu-huong">
          Tìm theo tên thủ tục, mã TTHC hoặc từ khoá
        </label>
        <input
          id="tim-chinh"
          type="search"
          placeholder="Tìm theo tên thủ tục, mã TTHC hoặc từ khoá…"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
        />
      </div>

      <div className="thanh-loc">
        <label htmlFor="loc-linhvuc" className="bo-qua-dieu-huong">
          Lọc theo lĩnh vực
        </label>
        <select
          id="loc-linhvuc"
          value={linhVuc}
          onChange={(e) => setLinhVuc(e.target.value)}
        >
          <option value="">Tất cả lĩnh vực</option>
          {danhSachLinhVuc.map((lv) => (
            <option key={lv.slug} value={lv.ten_linh_vuc}>
              {lv.ten_linh_vuc} ({lv.so_luong_tthc})
            </option>
          ))}
        </select>

        <label htmlFor="loc-cap" className="bo-qua-dieu-huong">
          Lọc theo cấp thực hiện
        </label>
        <select id="loc-cap" value={cap} onChange={(e) => setCap(e.target.value)}>
          <option value="">Mọi cấp thực hiện</option>
          {danhSachCap.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {dangLoc && (
          <button type="button" className="nut-xoa-loc" onClick={xoaLoc}>
            Xoá bộ lọc
          </button>
        )}

        <span className="dem-ketqua" role="status" aria-live="polite">
          {ketQua.length} / {danhSach.length} thủ tục
        </span>
      </div>

      {ketQua.length === 0 ? (
        <p className="khong-co-ket-qua">
          Không tìm thấy thủ tục phù hợp. Hãy thử từ khoá khác hoặc bỏ bớt bộ lọc.
        </p>
      ) : (
        <>
          <div className="danh-sach-tthc">
            {ketQua.slice(0, soHien).map((t) => (
              <DongTthc key={t.ma_tthc} tthc={t} tuKhoa={tuKhoa} />
            ))}
          </div>
          {soHien < ketQua.length && (
            <button
              type="button"
              className="tai-them"
              onClick={() => setSoHien((n) => n + MOI_TRANG)}
            >
              Xem thêm {Math.min(MOI_TRANG, ketQua.length - soHien)} thủ tục
              {" · "}
              còn {ketQua.length - soHien}
            </button>
          )}
        </>
      )}
    </>
  );
}
