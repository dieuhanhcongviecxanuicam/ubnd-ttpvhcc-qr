import type { Metadata } from "next";
import KhungXemTruoc from "@/components/ban-in/KhungXemTruoc";
import ToNhom from "@/components/ban-in/ToNhom";
import s from "@/components/ban-in/ban-in.module.css";
import { banIn } from "@/lib/ban-in";
import { layThongKeNhom } from "@/lib/data";

const BAN = banIn("to-nhom");

export const metadata: Metadata = {
  title: `${BAN.ten} - bản in ${BAN.khoGiay}`,
  robots: { index: false, follow: true },
};

/** Nguồn dựng PDF bộ tờ niêm yết theo nhóm, mỗi nhóm một trang A4. */
export default function TrangToNhom() {
  const nhom = layThongKeNhom();
  return (
    <main id="noi-dung" className={s.trangIn}>
      <h1 className={s.anChu}>{BAN.ten}</h1>
      <p className={s.trangInGhiChu}>
        {nhom.length} tờ khổ {BAN.khoGiay}. Tải PDF tại trang In bộ mã QR.
      </p>
      {nhom.map((tk) => (
        <KhungXemTruoc key={tk.nhom.id} rongMm={BAN.rongMm} caoMm={BAN.caoMm} tiLeBanDau={1}>
          <ToNhom tk={tk} taiNgay />
        </KhungXemTruoc>
      ))}
    </main>
  );
}
