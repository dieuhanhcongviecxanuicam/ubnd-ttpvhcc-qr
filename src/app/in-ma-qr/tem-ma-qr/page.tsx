import type { Metadata } from "next";
import KhungXemTruoc from "@/components/ban-in/KhungXemTruoc";
import TemMa from "@/components/ban-in/TemMa";
import s from "@/components/ban-in/ban-in.module.css";
import { banIn } from "@/lib/ban-in";
import { layDanhSachTem } from "@/lib/data";

const BAN = banIn("tem-ma-qr");

export const metadata: Metadata = {
  title: `${BAN.ten} - bản in ${BAN.khoGiay}`,
  robots: { index: false, follow: true },
};

/** Nguồn dựng PDF bộ tem mã QR, mỗi mã một trang A4. */
export default function TrangTemMaQr() {
  const tem = layDanhSachTem();
  return (
    <main id="noi-dung" className={s.trangIn}>
      <h1 className={s.anChu}>{BAN.ten}</h1>
      <p className={s.trangInGhiChu}>
        {tem.length} tem khổ {BAN.khoGiay}. Tải PDF tại trang In bộ mã QR.
      </p>
      {tem.map((t) => (
        <KhungXemTruoc key={t.khoa} rongMm={BAN.rongMm} caoMm={BAN.caoMm} tiLeBanDau={1}>
          <TemMa tem={t} taiNgay />
        </KhungXemTruoc>
      ))}
    </main>
  );
}
