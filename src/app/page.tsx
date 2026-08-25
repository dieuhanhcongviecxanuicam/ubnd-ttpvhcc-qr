import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import LuoiLinhVuc from "@/components/LuoiLinhVuc";
import { layMeta, layTatCaLinhVuc } from "@/lib/data";
import { duongDan, SITE_URL } from "@/lib/site-config";

export default function TrangChu() {
  const meta = layMeta();
  const linhVuc = layTatCaLinhVuc();

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
                <a className="btn-taixuong" href={duongDan("/qr/master.png")} download>
                  Tải PNG
                </a>
                <a
                  className="btn-taixuong btn-phu"
                  href={duongDan("/qr/master.svg")}
                  download
                >
                  Tải SVG
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="linh-vuc">
          <div className="section-head">
            <div>
              <h2>Mã QR theo lĩnh vực</h2>
            </div>
          </div>
          <LuoiLinhVuc danhSach={linhVuc} />
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
