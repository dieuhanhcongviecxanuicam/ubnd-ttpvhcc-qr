import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import NutIn from "@/components/NutIn";
import SiteFooter from "@/components/SiteFooter";
import { layMeta, layTatCaLinhVuc } from "@/lib/data";
import { duongDan, SITE_URL, urlLinhVuc } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "In bộ mã QR",
  description:
    "Bảng in khổ A4 toàn bộ mã QR lĩnh vực để dán tại bộ phận một cửa.",
  robots: { index: false, follow: true },
};

/**
 * Trang tiện ích cho cán bộ một cửa: in một lần ra toàn bộ mã QR lĩnh vực,
 * mỗi ô kèm tên lĩnh vực, số lượng thủ tục và URL đích để đối chiếu trước khi dán.
 */
export default function TrangInMaQr() {
  const meta = layMeta();
  const linhVuc = layTatCaLinhVuc();

  return (
    <>
      <main className="container" id="noi-dung">
        <div className="in-thanh-cong-cu">
          <div>
            <nav className="duong-dan" aria-label="Đường dẫn">
              <Link href="/">Trang chủ</Link> / In bộ mã QR
            </nav>
            <h1>Bảng in mã QR theo lĩnh vực</h1>
            <p>
              {meta.tong_so_linh_vuc} mã QR lĩnh vực + 1 mã QR tổng, bố cục sẵn cho
              khổ A4. Kiểm tra URL dưới mỗi mã khớp với địa chỉ triển khai trước khi in.
            </p>
          </div>
          <NutIn />
        </div>

        <div className="hop-luu-y khong-in">
          <strong>Trước khi in:</strong> các mã QR đang trỏ tới{" "}
          <code>{SITE_URL}</code>. Nếu đơn vị triển khai trên tên miền khác, hãy đặt
          biến <code>NEXT_PUBLIC_SITE_ORIGIN</code> rồi chạy lại{" "}
          <code>npm run du-lieu:tao-qr</code> để sinh lại toàn bộ mã QR.
        </div>

        <div className="in-luoi">
          <div className="in-o">
            <Image
              src={duongDan("/qr/master.png")}
              alt="Mã QR tổng"
              width={128}
              height={128}
              unoptimized
            />
            <div className="in-ten">TOÀN BỘ DANH MỤC</div>
            <div className="in-so">{meta.tong_so_tthc} thủ tục</div>
            <div className="in-url">{SITE_URL}/</div>
          </div>

          {linhVuc.map((lv) => (
            <div className="in-o" key={lv.slug}>
              <Image
                src={duongDan(`/qr/lv-${lv.slug}.png`)}
                alt={`Mã QR lĩnh vực ${lv.ten_linh_vuc}`}
                width={128}
                height={128}
                unoptimized
              />
              <div className="in-ten">{lv.ten_linh_vuc}</div>
              <div className="in-so">{lv.so_luong_tthc} thủ tục</div>
              <div className="in-url">{urlLinhVuc(lv.slug)}</div>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter ghiChu={`${meta.tong_so_linh_vuc + 1} mã QR`} />
    </>
  );
}
