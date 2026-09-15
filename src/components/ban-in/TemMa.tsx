import Image from "next/image";
import type { TemQr } from "@/lib/data";
import { duongDan } from "@/lib/site-config";
import { CuoiA4, DauA4 } from "./PhanA4";
import s from "./ban-in.module.css";

/** Tem mã QR cỡ lớn, mỗi mã một tờ A4 - dán tại quầy hoặc cửa phòng. */
export default function TemMa({ tem, taiNgay = false }: { tem: TemQr; taiNgay?: boolean }) {
  const loading = taiNgay ? "eager" : "lazy";
  return (
    <article className={`${s.to} ${s.toA4}`} data-nhom={tem.nhomId}>
      <DauA4 loading={loading} />
      <div className={s.temNhan}>
        <p>{tem.nhan}</p>
        <h2>{tem.ten}</h2>
      </div>
      <div className={s.temKhung}>
        <Image
          className={s.temQr}
          src={duongDan(tem.qr)}
          alt={`Mã QR ${tem.nhan.toLowerCase()} ${tem.ten}`}
          width={300}
          height={300}
          loading={loading}
          unoptimized
        />
        <p className={s.temHuongDan}>Quét mã để xem {tem.soTthc} thủ tục hành chính</p>
        <p className={s.temUrl}>{tem.url.replace(/^https?:\/\//, "")}</p>
      </div>
      <CuoiA4 />
    </article>
  );
}
