import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import LuoiLinhVuc from "@/components/LuoiLinhVuc";
import NutTaiXemTruoc from "@/components/NutTaiXemTruoc";
import { layMeta, layTheLinhVuc } from "@/lib/data";
import { duongDan, SITE_URL } from "@/lib/site-config";
import { thongTinTepQr } from "@/lib/tep";

export default function TrangChu() {
  const meta = layMeta();
  const linhVuc = layTheLinhVuc();

  return (
    <>
      <main className="container" id="noi-dung">
        <section className="hero">
          <div className="hero-grid">
            <div>
              <p className="ten-don-vi">
                <span className="don-vi-cap-tren">ỦY BAN NHÂN DÂN XÃ NÚI CẤM</span>
                <span className="don-vi-chinh">TRUNG TÂM PHỤC VỤ HÀNH CHÍNH CÔNG</span>
              </p>
              <h1>
                Quét mã, tra cứu <em>thủ tục hành chính</em>
              </h1>

              <dl className="thong-ke">
                <div>
                  <dd className="so">{meta.tong_so_tthc}</dd>
                  <dt className="nhan">Thủ tục hành chính</dt>
                </div>
                <div>
                  <dd className="so">{meta.tong_so_linh_vuc}</dd>
                  <dt className="nhan">Lĩnh vực</dt>
                </div>
                <div>
                  <dd className="so">100%</dd>
                  <dt className="nhan">Liên kết Cổng DVCQG</dt>
                </div>
              </dl>

              <div className="hang-nut">
                <Link href="/danh-muc" className="btn-taixuong">
                  Xem toàn bộ danh mục
                </Link>
                <Link href="/in-ma-qr" className="btn-taixuong btn-phu">
                  In bộ mã QR
                </Link>
              </div>
            </div>

            <div className="qr-tong-the">
              <span className="qr-goc-1" />
              <span className="qr-goc-2" />
              <p className="qr-nhan">Mã QR tổng - toàn bộ danh mục</p>
              <Image
                src={duongDan("/qr/master.png")}
                alt="Mã QR dẫn đến toàn bộ danh mục thủ tục hành chính"
                width={200}
                height={200}
                priority
                unoptimized
              />
              <p className="qr-mo-ta">
                Quét để mở toàn bộ {meta.tong_so_tthc} thủ tục hành chính
              </p>
              <p className="qr-lienket">{SITE_URL}/</p>
              <div className="hang-nut-qr">
                <NutTaiXemTruoc
                  nhan="Tải PNG"
                  {...thongTinTepQr("/qr/master.png", `${SITE_URL}/`, "Mã QR tổng - toàn bộ danh mục")}
                />
                <NutTaiXemTruoc
                  nhan="Tải SVG"
                  phu
                  {...thongTinTepQr("/qr/master.svg", `${SITE_URL}/`, "Mã QR tổng - toàn bộ danh mục")}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="linh-vuc">
          <div className="bang-niem-yet-dau">
            <p className="bang-niem-yet-eyebrow">Bảng niêm yết điện tử</p>
            <h2>Mã QR theo lĩnh vực</h2>
            <p className="bang-niem-yet-mo-ta">
              {meta.tong_so_linh_vuc} lĩnh vực với {meta.tong_so_tthc} thủ tục hành
              chính thuộc phạm vi giải quyết của Ủy ban nhân dân xã Núi Cấm. Quét mã
              QR bằng camera điện thoại, hoặc bấm vào thẻ để xem danh sách thủ tục.
            </p>
          </div>
          <LuoiLinhVuc danhSach={linhVuc} />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
