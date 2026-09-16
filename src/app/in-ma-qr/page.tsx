import type { Metadata } from "next";
import Link from "next/link";
import NutTaiXemTruoc from "@/components/NutTaiXemTruoc";
import SiteFooter from "@/components/SiteFooter";
import BangNiemYet from "@/components/ban-in/BangNiemYet";
import KhungXemTruoc from "@/components/ban-in/KhungXemTruoc";
import TemMa from "@/components/ban-in/TemMa";
import ToNhom from "@/components/ban-in/ToNhom";
import s from "@/components/ban-in/ban-in.module.css";
import { banIn, tenTepAnh, tenTepPdf, THU_MUC_BAN_IN, type BanIn } from "@/lib/ban-in";
import { layDanhSachTem, layMeta, layThongKeNhom } from "@/lib/data";
import { duongDan, SITE_URL } from "@/lib/site-config";
import type { DuLieuTaiVe } from "@/lib/types";

export const metadata: Metadata = {
  title: "In bộ mã QR",
  description:
    "Bảng niêm yết tổng khổ A1, tờ niêm yết theo nhóm và tem mã QR khổ A4 - dựng sẵn thành PDF để in.",
  robots: { index: false, follow: true },
};

/** Dữ liệu cửa sổ xem trước cho một tệp PDF bản in. */
function taiPdf(b: BanIn, soTrang: number, noiDung: string): DuLieuTaiVe {
  return {
    href: duongDan(`${THU_MUC_BAN_IN}/${tenTepPdf(b)}`),
    tenTep: tenTepPdf(b),
    tieuDe: b.ten,
    anhXemTruoc: duongDan(`${THU_MUC_BAN_IN}/${tenTepAnh(b)}`),
    thongTin: [
      { nhan: "Khổ giấy", giaTri: `${b.khoGiay} · ${b.rongMm} × ${b.caoMm} mm` },
      { nhan: "Số trang", giaTri: String(soTrang) },
      { nhan: "Nội dung", giaTri: noiDung },
      { nhan: "Mã QR mở tới", giaTri: SITE_URL },
    ],
    ghiChu: b.ghiChu,
  };
}

/**
 * Trang in bộ mã QR: ba bản in dựng sẵn thành PDF lúc triển khai
 * (scripts/dung-ban-in.ts), mỗi bản kèm bản xem trước ngay trên trang và nút tải
 * có bước kiểm tra.
 *
 * Bản xem trước ở đây ẩn khỏi trình đọc màn hình: nó là bản sao minh hoạ của tệp
 * PDF, đọc lên sẽ thành hàng chục mã QR lặp lại. Nội dung thật đọc được ở trang
 * xem toàn trang của từng bản in.
 */
export default function TrangInMaQr() {
  const meta = layMeta();
  const nhom = layThongKeNhom();
  const tem = layDanhSachTem();
  const bang = banIn("bang-niem-yet");
  const toNhom = banIn("to-nhom");
  const temMa = banIn("tem-ma-qr");
  const soQrToNhom = nhom.reduce((tong, tk) => tong + 1 + tk.soLinhVuc, 0);

  return (
    <>
      <main className="container" id="noi-dung">
        <div className={s.hubMoDau}>
          <nav className="duong-dan" aria-label="Đường dẫn">
            <Link href="/">Trang chủ</Link> / In bộ mã QR
          </nav>
          <h1>In bộ mã QR</h1>
        </div>

        <section className={s.hubSanPham} aria-labelledby="ban-bang">
          <div className={s.hubDau}>
            <div>
              <h2 id="ban-bang">{bang.ten}</h2>
              <div className={s.hubNhan}>
                <span>{bang.khoGiay}</span>
                <span>1 trang</span>
                <span>{nhom.length + 2} mã QR</span>
              </div>
            </div>
            <div className={s.hubNut}>
              <NutTaiXemTruoc
                nhan="Tải PDF"
                {...taiPdf(bang, 1, `${nhom.length} nhóm lĩnh vực, hướng dẫn tra cứu, số hỗ trợ`)}
              />
              <Link className="btn-taixuong btn-phu" href={bang.route}>
                Xem toàn trang
              </Link>
            </div>
          </div>
          <div className={s.hubXem}>
            <KhungXemTruoc rongMm={bang.rongMm} caoMm={bang.caoMm} anVoiTroNang>
              <BangNiemYet nhom={nhom} tongTthc={meta.tong_so_tthc} tongLinhVuc={meta.tong_so_linh_vuc} />
            </KhungXemTruoc>
          </div>
        </section>

        <section className={s.hubSanPham} aria-labelledby="ban-nhom">
          <div className={s.hubDau}>
            <div>
              <h2 id="ban-nhom">{toNhom.ten}</h2>
              <div className={s.hubNhan}>
                <span>{toNhom.khoGiay}</span>
                <span>{nhom.length} trang</span>
                <span>{soQrToNhom} mã QR</span>
              </div>
            </div>
            <div className={s.hubNut}>
              <NutTaiXemTruoc
                nhan="Tải PDF"
                {...taiPdf(toNhom, nhom.length, `${nhom.length} tờ, mỗi tờ một nhóm lĩnh vực`)}
              />
              <Link className="btn-taixuong btn-phu" href={toNhom.route}>
                Xem toàn trang
              </Link>
            </div>
          </div>
          <div className={s.hubDaiA4}>
            {nhom.map((tk) => (
              <KhungXemTruoc key={tk.nhom.id} rongMm={toNhom.rongMm} caoMm={toNhom.caoMm} anVoiTroNang>
                <ToNhom tk={tk} />
              </KhungXemTruoc>
            ))}
          </div>
        </section>

        <section className={s.hubSanPham} aria-labelledby="ban-tem">
          <div className={s.hubDau}>
            <div>
              <h2 id="ban-tem">{temMa.ten}</h2>
              <div className={s.hubNhan}>
                <span>{temMa.khoGiay}</span>
                <span>{tem.length} trang</span>
                <span>{tem.length} mã QR</span>
              </div>
            </div>
            <div className={s.hubNut}>
              <NutTaiXemTruoc
                nhan="Tải PDF"
                {...taiPdf(temMa, tem.length, `Mã tổng, ${nhom.length} mã nhóm, ${meta.tong_so_linh_vuc} mã lĩnh vực`)}
              />
              <Link className="btn-taixuong btn-phu" href={temMa.route}>
                Xem toàn trang
              </Link>
            </div>
          </div>
          <div className={s.hubDaiA4}>
            {tem.slice(0, 4).map((t) => (
              <KhungXemTruoc key={t.khoa} rongMm={temMa.rongMm} caoMm={temMa.caoMm} anVoiTroNang>
                <TemMa tem={t} />
              </KhungXemTruoc>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter ghiChu={`${tem.length} mã QR trong bộ bản in`} />
    </>
  );
}
