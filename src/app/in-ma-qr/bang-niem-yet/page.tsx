import type { Metadata } from "next";
import Link from "next/link";
import BangNiemYet from "@/components/ban-in/BangNiemYet";
import KhungXemTruoc from "@/components/ban-in/KhungXemTruoc";
import s from "@/components/ban-in/ban-in.module.css";
import { banIn } from "@/lib/ban-in";
import { layMeta, layThongKeNhom } from "@/lib/data";

const BAN = banIn("bang-niem-yet");

export const metadata: Metadata = {
  title: `${BAN.ten} - bản in ${BAN.khoGiay}`,
  robots: { index: false, follow: true },
};

/** Nguồn dựng PDF bảng niêm yết tổng, đồng thời là bản xem trước toàn trang. */
export default function TrangBangNiemYet() {
  const meta = layMeta();
  return (
    <main id="noi-dung" className={s.trangIn}>
      <h1 className={s.anChu}>{BAN.ten}</h1>
      <p className={s.trangInGhiChu}>
        Bản xem trước khổ {BAN.khoGiay} ({BAN.rongMm} × {BAN.caoMm} mm). Tải PDF tại trang{" "}
        <Link className={s.trangInLienKet} href="/in-ma-qr">
          In bộ mã QR
        </Link>
        .
      </p>
      <KhungXemTruoc rongMm={BAN.rongMm} caoMm={BAN.caoMm}>
        <BangNiemYet
          nhom={layThongKeNhom()}
          tongTthc={meta.tong_so_tthc}
          tongLinhVuc={meta.tong_so_linh_vuc}
          taiNgay
        />
      </KhungXemTruoc>
    </main>
  );
}
