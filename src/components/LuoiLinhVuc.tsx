"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { duongDan } from "@/lib/site-config";
import { boDau } from "@/lib/text";
import type { LinhVuc } from "@/lib/types";
import ChuKhop from "./ChuKhop";
import IconTimKiem from "./IconTimKiem";

/** Lưới mã QR theo lĩnh vực ở trang chủ, kèm ô lọc theo tên. */
export default function LuoiLinhVuc({ danhSach }: { danhSach: LinhVuc[] }) {
  const [tuKhoa, setTuKhoa] = useState("");

  const ketQua = useMemo(() => {
    const q = boDau(tuKhoa.trim());
    if (!q) return danhSach;
    return danhSach.filter((lv) => boDau(lv.ten_linh_vuc).includes(q));
  }, [danhSach, tuKhoa]);

  return (
    <>
      <div className="o-tim-lon">
        <IconTimKiem size={18} />
        <label htmlFor="tim-linhvuc" className="bo-qua-dieu-huong">
          Lọc theo tên lĩnh vực
        </label>
        <input
          id="tim-linhvuc"
          type="search"
          placeholder="Lọc theo tên lĩnh vực…"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
        />
      </div>

      {ketQua.length === 0 ? (
        <p className="khong-co-ket-qua">Không tìm thấy lĩnh vực phù hợp.</p>
      ) : (
        <div className="luoi-linhvuc">
          {ketQua.map((lv) => (
            <Link className="the-linhvuc" key={lv.slug} href={`/linh-vuc/${lv.slug}`}>
              <Image
                className="mini-qr"
                src={duongDan(`/qr/lv-${lv.slug}.png`)}
                alt=""
                width={52}
                height={52}
                unoptimized
              />
              <div className="the-linhvuc-noidung">
                <h3>
                  <ChuKhop chuoi={lv.ten_linh_vuc} tuKhoa={tuKhoa} />
                </h3>
                <div className="so-luong">{lv.so_luong_tthc} thủ tục</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
