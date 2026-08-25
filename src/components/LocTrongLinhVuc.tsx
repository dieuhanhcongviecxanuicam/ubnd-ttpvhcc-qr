"use client";

import { useMemo, useState } from "react";
import { boDau } from "@/lib/text";
import type { TthcTomTat } from "@/lib/types";
import DongTthc from "./DongTthc";
import IconTimKiem from "./IconTimKiem";

/** Lọc nhanh trong phạm vi một lĩnh vực (số lượng nhỏ nên hiển thị hết, không phân trang). */
export default function LocTrongLinhVuc({ danhSach }: { danhSach: TthcTomTat[] }) {
  const [tuKhoa, setTuKhoa] = useState("");

  const ketQua = useMemo(() => {
    const q = boDau(tuKhoa.trim());
    if (!q) return danhSach;
    return danhSach.filter((t) => t.tim_kiem.includes(q));
  }, [danhSach, tuKhoa]);

  return (
    <>
      <div className="o-tim-lon">
        <IconTimKiem size={18} />
        <label htmlFor="tim-trong-lv" className="bo-qua-dieu-huong">
          Lọc thủ tục trong lĩnh vực này
        </label>
        <input
          id="tim-trong-lv"
          type="search"
          placeholder="Lọc thủ tục trong lĩnh vực này…"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
        />
      </div>

      {ketQua.length === 0 ? (
        <p className="khong-co-ket-qua">Không tìm thấy thủ tục phù hợp.</p>
      ) : (
        <div className="danh-sach-tthc">
          {ketQua.map((t) => (
            <DongTthc key={t.ma_tthc} tthc={t} phu="cap_thuc_hien" />
          ))}
        </div>
      )}
    </>
  );
}
