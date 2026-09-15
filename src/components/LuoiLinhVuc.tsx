"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { hinhCuaLinhVuc, NHOM_LINH_VUC } from "@/lib/nhom-linh-vuc";
import { duongDan } from "@/lib/site-config";
import { boDau } from "@/lib/text";
import type { TheLinhVuc } from "@/lib/types";
import ChuKhop from "./ChuKhop";
import IconTimKiem from "./IconTimKiem";

const TAT_CA = "tat-ca";

/**
 * Bảng mã QR theo lĩnh vực ở trang chủ - bản điện tử của bảng niêm yết giấy
 * treo tại bộ phận một cửa.
 *
 * Mỗi lĩnh vực là một thẻ: dải tiêu đề màu theo nhóm ngành, hình minh hoạ, mã QR
 * để quét ngay từ màn hình, vài thủ tục tiêu biểu và nút mở trang chi tiết. Thẻ
 * gom theo 13 nhóm ngành, kèm hai bộ lọc độc lập: chip nhóm và ô tìm theo tên.
 *
 * Toàn bộ 77 thẻ vẫn nằm trong HTML tĩnh; bộ lọc chỉ ẩn/hiện phía trình duyệt
 * nên người tắt JavaScript vẫn đọc và quét được đủ mã QR.
 */
export default function LuoiLinhVuc({ danhSach }: { danhSach: TheLinhVuc[] }) {
  const [tuKhoa, setTuKhoa] = useState("");
  const [nhomChon, setNhomChon] = useState(TAT_CA);

  /** Số lĩnh vực của từng nhóm - hiện trên chip để biết nhóm nào có gì. */
  const demTheoNhom = useMemo(() => {
    const dem = new Map<string, number>();
    for (const lv of danhSach) dem.set(lv.nhom, (dem.get(lv.nhom) ?? 0) + 1);
    return dem;
  }, [danhSach]);

  const ketQua = useMemo(() => {
    const q = boDau(tuKhoa.trim());
    return danhSach.filter(
      (lv) =>
        (nhomChon === TAT_CA || lv.nhom === nhomChon) &&
        (!q || boDau(lv.ten_linh_vuc).includes(q)),
    );
  }, [danhSach, tuKhoa, nhomChon]);

  /** Gom kết quả theo nhóm, giữ đúng thứ tự nhóm đã khai báo. */
  const khoiNhom = useMemo(
    () =>
      NHOM_LINH_VUC.map((nhom) => ({
        nhom,
        linhVuc: ketQua.filter((lv) => lv.nhom === nhom.id),
      })).filter((k) => k.linhVuc.length > 0),
    [ketQua],
  );

  return (
    <>
      <div className="bo-loc-linhvuc">
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

        <div className="chip-nhom" role="group" aria-label="Lọc theo nhóm lĩnh vực">
          <button
            type="button"
            className="chip"
            data-nhom={TAT_CA}
            aria-pressed={nhomChon === TAT_CA}
            onClick={() => setNhomChon(TAT_CA)}
          >
            Tất cả <span className="chip-dem">{danhSach.length}</span>
          </button>
          {NHOM_LINH_VUC.map((nhom) => {
            const dem = demTheoNhom.get(nhom.id) ?? 0;
            if (dem === 0) return null;
            return (
              <button
                key={nhom.id}
                type="button"
                className="chip"
                data-nhom={nhom.id}
                aria-pressed={nhomChon === nhom.id}
                onClick={() => setNhomChon(nhom.id === nhomChon ? TAT_CA : nhom.id)}
              >
                {nhom.tenNgan} <span className="chip-dem">{dem}</span>
              </button>
            );
          })}
        </div>

        <p className="dem-linhvuc" aria-live="polite">
          {ketQua.length === danhSach.length
            ? `${danhSach.length} lĩnh vực`
            : `${ketQua.length}/${danhSach.length} lĩnh vực`}
        </p>
      </div>

      {khoiNhom.length === 0 ? (
        <div className="khong-co-ket-qua">
          <p>Không tìm thấy lĩnh vực phù hợp.</p>
          <button
            type="button"
            className="nut-bo-loc"
            onClick={() => {
              setTuKhoa("");
              setNhomChon(TAT_CA);
            }}
          >
            Bỏ bộ lọc, xem lại 77 lĩnh vực
          </button>
        </div>
      ) : (
        khoiNhom.map(({ nhom, linhVuc }) => (
          <section className="khoi-nhom" key={nhom.id} data-nhom={nhom.id}>
            <h3 className="khoi-nhom-tieu-de">
              <span className="khoi-nhom-ten">{nhom.ten}</span>
              <span className="khoi-nhom-dem">{linhVuc.length} lĩnh vực</span>
            </h3>

            <div className="luoi-linhvuc">
              {linhVuc.map((lv) => (
                <TheLinhVucQr key={lv.slug} lv={lv} tuKhoa={tuKhoa} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}

/** Một thẻ lĩnh vực: dải tiêu đề, hình minh hoạ, mã QR, thủ tục tiêu biểu, nút xem. */
function TheLinhVucQr({ lv, tuKhoa }: { lv: TheLinhVuc; tuKhoa: string }) {
  const conLai = lv.so_luong_tthc - lv.thu_tuc_tieu_bieu.length;

  return (
    <article className="the-lv" data-nhom={lv.nhom}>
      <header className="the-lv-dau">
        <p className="the-lv-nhan">Lĩnh vực</p>
        <h4 className="the-lv-ten">
          <ChuKhop chuoi={lv.ten_linh_vuc} tuKhoa={tuKhoa} />
        </h4>
      </header>

      <div className="the-lv-anh">
        <Image
          className="the-lv-hinh"
          src={duongDan(`/minh-hoa/${hinhCuaLinhVuc(lv.slug)}`)}
          alt=""
          width={240}
          height={160}
          unoptimized
        />
        <Image
          className="the-lv-qr"
          src={duongDan(`/qr/lv-${lv.slug}.png`)}
          alt={`Mã QR lĩnh vực ${lv.ten_linh_vuc}`}
          width={104}
          height={104}
          unoptimized
        />
      </div>

      <div className="the-lv-than">
        <p className="the-lv-dem">
          <strong>{lv.so_luong_tthc}</strong> thủ tục hành chính
        </p>
        <ol className="the-lv-ds">
          {lv.thu_tuc_tieu_bieu.map((ten, i) => (
            <li key={i}>{ten}</li>
          ))}
        </ol>
        {conLai > 0 && <p className="the-lv-con">và {conLai} thủ tục khác</p>}
      </div>

      {/* Nhãn trợ năng CHỨA nguyên văn chữ hiện trên nút (WCAG 2.5.3 "Label in
          Name"): người dùng lệnh giọng nói đọc đúng chữ thấy trên màn hình thì
          liên kết phải kích hoạt được. Phần tên lĩnh vực thêm vào để 77 liên kết
          giống hệt nhau vẫn phân biệt được khi đọc danh sách liên kết. */}
      <Link
        className="the-lv-nut"
        href={`/linh-vuc/${lv.slug}`}
        aria-label={`Quét mã để xem chi tiết lĩnh vực ${lv.ten_linh_vuc}`}
      >
        Quét mã để xem chi tiết
      </Link>
    </article>
  );
}
