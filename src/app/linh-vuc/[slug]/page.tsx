import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import LocTrongLinhVuc from "@/components/LocTrongLinhVuc";
import SiteFooter from "@/components/SiteFooter";
import {
  layLinhVucTheoSlug,
  layTatCaLinhVuc,
  layTthcTheoLinhVuc,
} from "@/lib/data";
import { duongDan, urlLinhVuc } from "@/lib/site-config";

type Props = { params: Promise<{ slug: string }> };

/** Sinh sẵn toàn bộ trang lĩnh vực lúc build — đây chính là đích đến của mã QR lĩnh vực. */
export function generateStaticParams() {
  return layTatCaLinhVuc().map((lv) => ({ slug: lv.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lv = layLinhVucTheoSlug(slug);
  if (!lv) return { title: "Không tìm thấy lĩnh vực" };

  return {
    title: lv.ten_linh_vuc,
    description: `Danh sách ${lv.so_luong_tthc} thủ tục hành chính thuộc lĩnh vực ${lv.ten_linh_vuc}. Quét mã QR để tra cứu nhanh.`,
    alternates: { canonical: `/linh-vuc/${lv.slug}/` },
  };
}

export default async function TrangLinhVuc({ params }: Props) {
  const { slug } = await params;
  const lv = layLinhVucTheoSlug(slug);
  if (!lv) notFound();

  const danhSach = layTthcTheoLinhVuc(lv.ten_linh_vuc);

  return (
    <>
      <main className="container" id="noi-dung">
        <div className="lv-hero">
          <div className="lv-qr-box">
            <Image
              src={duongDan(`/qr/lv-${lv.slug}.png`)}
              alt={`Mã QR lĩnh vực ${lv.ten_linh_vuc}`}
              width={200}
              height={200}
              priority
              unoptimized
            />
            <div className="lv-qr-nut">
              <a className="btn-taixuong" href={duongDan(`/qr/lv-${lv.slug}.png`)} download>
                PNG
              </a>
              <a
                className="btn-taixuong btn-phu"
                href={duongDan(`/qr/lv-${lv.slug}.svg`)}
                download
              >
                SVG
              </a>
            </div>
          </div>
          <div>
            <nav className="duong-dan" aria-label="Đường dẫn">
              <Link href="/">Trang chủ</Link> / Lĩnh vực
            </nav>
            <p className="the-so-luong">{lv.so_luong_tthc} thủ tục hành chính</p>
            <h1 className="lv-tieu-de">{lv.ten_linh_vuc}</h1>
            <p className="lv-url">{urlLinhVuc(lv.slug)}</p>
          </div>
        </div>

        <section className="section">
          <LocTrongLinhVuc danhSach={danhSach} />
        </section>
      </main>

      <SiteFooter ghiChu={`${lv.so_luong_tthc} thủ tục trong lĩnh vực này`} />
    </>
  );
}
