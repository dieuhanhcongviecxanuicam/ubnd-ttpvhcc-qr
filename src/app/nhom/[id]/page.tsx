import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TheLinhVucQr } from "@/components/LuoiLinhVuc";
import NutTaiXemTruoc from "@/components/NutTaiXemTruoc";
import SiteFooter from "@/components/SiteFooter";
import { layThongKeNhom } from "@/lib/data";
import { NHOM_LINH_VUC } from "@/lib/nhom-linh-vuc";
import { duongDan, urlNhom } from "@/lib/site-config";
import { thongTinTepQr } from "@/lib/tep";

type Props = { params: Promise<{ id: string }> };

/**
 * Trang nhóm ngành - đích đến của 13 mã QR trên bảng niêm yết tổng.
 *
 * Người dân quét mã nhóm (ví dụ "Tư pháp - Hộ tịch") rồi chọn đúng lĩnh vực
 * mình cần. URL /nhom/<id> đã in lên giấy thì KHÔNG được đổi: id lấy từ
 * data/nhom-linh-vuc.json, và scripts/kiem-tra-ma-qr.py giải mã ngược từng mã
 * để đối chiếu với đúng các route này.
 */
export function generateStaticParams() {
  return NHOM_LINH_VUC.map((n) => ({ id: n.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tk = layThongKeNhom().find((x) => x.nhom.id === id);
  if (!tk) return { title: "Không tìm thấy nhóm lĩnh vực" };
  return {
    title: tk.nhom.ten,
    description: `${tk.soLinhVuc} lĩnh vực với ${tk.soTthc} thủ tục hành chính thuộc nhóm ${tk.nhom.ten}. Quét mã QR để tra cứu nhanh.`,
    alternates: { canonical: `/nhom/${tk.nhom.id}` },
  };
}

export default async function TrangNhom({ params }: Props) {
  const { id } = await params;
  const tk = layThongKeNhom().find((x) => x.nhom.id === id);
  if (!tk) notFound();

  const { nhom, soLinhVuc, soTthc, linhVuc } = tk;
  const url = urlNhom(nhom.id);
  const tieuDeQr = `Mã QR nhóm ${nhom.ten}`;

  return (
    <>
      <main className="container" id="noi-dung">
        <div className="lv-hero" data-nhom={nhom.id}>
          <div className="lv-qr-box">
            <Image
              src={duongDan(`/qr/nhom-${nhom.id}.png`)}
              alt={tieuDeQr}
              width={200}
              height={200}
              priority
              unoptimized
            />
            <div className="lv-qr-nut">
              <NutTaiXemTruoc nhan="PNG" {...thongTinTepQr(`/qr/nhom-${nhom.id}.png`, url, tieuDeQr)} />
              <NutTaiXemTruoc nhan="SVG" phu {...thongTinTepQr(`/qr/nhom-${nhom.id}.svg`, url, tieuDeQr)} />
            </div>
          </div>
          <div>
            <nav className="duong-dan" aria-label="Đường dẫn">
              <Link href="/">Trang chủ</Link> / <Link href="/#linh-vuc">Lĩnh vực</Link> / Nhóm
            </nav>
            <p className="the-so-luong">
              {soLinhVuc} lĩnh vực · {soTthc} thủ tục hành chính
            </p>
            <h1 className="lv-tieu-de">{nhom.ten}</h1>
            <p className="lv-url">{url}</p>
          </div>
        </div>

        <section className="section" aria-labelledby="ds-linh-vuc">
          <h2 id="ds-linh-vuc" className="nhom-ds-tieu-de">
            Các lĩnh vực trong nhóm
          </h2>
          <div className="luoi-linhvuc">
            {linhVuc.map((lv) => (
              <TheLinhVucQr key={lv.slug} lv={lv} tuKhoa="" capTieuDe="h3" />
            ))}
          </div>
        </section>
      </main>

      <SiteFooter ghiChu={`${soLinhVuc} lĩnh vực trong nhóm này`} />
    </>
  );
}
