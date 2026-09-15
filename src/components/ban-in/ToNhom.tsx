import Image from "next/image";
import type { ThongKeNhom } from "@/lib/data";
import { duongDan } from "@/lib/site-config";
import { catNgan } from "@/lib/text";
import { CuoiA4, DauA4 } from "./PhanA4";
import s from "./ban-in.module.css";

/**
 * Số cột theo số lĩnh vực: nhóm đông nhất (13 lĩnh vực) vẫn nằm gọn một tờ A4
 * với lưới 4 cột, còn nhóm ít lĩnh vực được mã QR to hơn cho dễ quét.
 */
function lopCot(soLinhVuc: number): string {
  if (soLinhVuc <= 4) return s.cot2;
  if (soLinhVuc <= 9) return s.cot3;
  return s.cot4;
}

/** Tờ niêm yết một nhóm, khổ A4 dọc: mã QR nhóm và mã QR từng lĩnh vực. */
export default function ToNhom({ tk, taiNgay = false }: { tk: ThongKeNhom; taiNgay?: boolean }) {
  const loading = taiNgay ? "eager" : "lazy";
  const { nhom, linhVuc, soLinhVuc, soTthc } = tk;

  return (
    <article className={`${s.to} ${s.toA4}`} data-nhom={nhom.id}>
      <DauA4 loading={loading} />
      <div className={s.a4Nhom}>
        <div>
          <p>Lĩnh vực</p>
          <h2>{nhom.ten}</h2>
          <p className={s.a4NhomSo}>
            {soLinhVuc} lĩnh vực · {soTthc} thủ tục hành chính
          </p>
        </div>
        <Image
          className={s.a4NhomQr}
          src={duongDan(`/qr/nhom-${nhom.id}.svg`)}
          alt={`Mã QR nhóm ${nhom.ten}`}
          width={300}
          height={300}
          loading={loading}
          unoptimized
        />
      </div>
      <ul className={`${s.a4Luoi} ${lopCot(soLinhVuc)}`}>
        {linhVuc.map((lv) => (
          <li key={lv.slug} className={s.a4O}>
            <Image
              className={s.a4OQr}
              src={duongDan(`/qr/lv-${lv.slug}.svg`)}
              alt={`Mã QR lĩnh vực ${lv.ten_linh_vuc}`}
              width={300}
              height={300}
              loading={loading}
              unoptimized
            />
            <strong>{catNgan(lv.ten_linh_vuc, 60)}</strong>
            <span>{lv.so_luong_tthc} thủ tục</span>
          </li>
        ))}
      </ul>
      <CuoiA4 />
    </article>
  );
}
