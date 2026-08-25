import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";
import {
  layLinhVucTheoSlug,
  laySlugLinhVuc,
  layTatCaTthc,
  layTthcTheoMa,
} from "@/lib/data";
import { duongDan } from "@/lib/site-config";

type Props = { params: Promise<{ ma: string }> };

/** Pre-render toàn bộ trang chi tiết - nội dung nằm sẵn trong HTML, tốt cho SEO
 *  và cho người dân dùng mạng chậm (không phải tải JSON rồi mới render). */
export function generateStaticParams() {
  return layTatCaTthc().map((t) => ({ ma: t.ma_tthc }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ma } = await params;
  const t = layTthcTheoMa(decodeURIComponent(ma));
  if (!t) return { title: "Không tìm thấy thủ tục" };

  return {
    title: t.ten_tthc,
    description:
      `Thủ tục ${t.ma_tthc} - ${t.ten_tthc}. Lĩnh vực ${t.linh_vuc}. ` +
      `Trình tự, hồ sơ, lệ phí và căn cứ pháp lý.`,
    alternates: { canonical: `/tthc/${t.ma_tthc}` },
  };
}

export default async function TrangChiTietTthc({ params }: Props) {
  const { ma } = await params;
  const t = layTthcTheoMa(decodeURIComponent(ma));
  if (!t) notFound();

  const slugLinhVuc = laySlugLinhVuc(t.linh_vuc);
  const lv = slugLinhVuc ? layLinhVucTheoSlug(slugLinhVuc) : undefined;

  return (
    <>
      <main className="container" id="noi-dung">
        <div className="tt-hero">
          <nav className="duong-dan" aria-label="Đường dẫn">
            <Link href="/">Trang chủ</Link> /{" "}
            {lv ? (
              <Link href={`/linh-vuc/${lv.slug}`}>{lv.ten_linh_vuc}</Link>
            ) : (
              t.linh_vuc
            )}{" "}
            / Chi tiết
          </nav>
          <p className="tt-ma">{t.ma_tthc}</p>
          <h1>{t.ten_tthc}</h1>
          {t.trang_thai && <p className="the-trangthai">{t.trang_thai}</p>}
        </div>

        <div className="tt-luoi">
          <div>
            <section className="tt-khoi">
              <h2>Thông tin chung</h2>
              <dl className="thong-tin-luoi">
                <ThongTin nhan="Lĩnh vực" giaTri={t.linh_vuc} />
                <ThongTin nhan="Cấp thực hiện" giaTri={t.cap_thuc_hien} />
                <ThongTin nhan="Cơ quan ban hành" giaTri={t.co_quan_ban_hanh} />
                <ThongTin nhan="Cơ quan thực hiện" giaTri={t.co_quan_thuc_hien} />
                <ThongTin nhan="Đối tượng thực hiện" giaTri={t.doi_tuong_thuc_hien} />
                <ThongTin nhan="Loại TTHC" giaTri={t.loai_tthc} />
                <ThongTin nhan="Số quyết định" giaTri={t.so_quyet_dinh} />
                <ThongTin nhan="Ngày quyết định" giaTri={t.ngay_quyet_dinh} />
                {t.dia_chi_tiep_nhan && (
                  <ThongTin
                    nhan="Địa chỉ tiếp nhận hồ sơ"
                    giaTri={t.dia_chi_tiep_nhan}
                    toanHang
                  />
                )}
              </dl>
            </section>

            {t.yeu_cau_dieu_kien && (
              <section className="tt-khoi">
                <h2>Yêu cầu, điều kiện thực hiện</h2>
                <p className="buoc-noidung">{t.yeu_cau_dieu_kien}</p>
              </section>
            )}

            {t.trinh_tu_thuc_hien?.length ? (
              <section className="tt-khoi">
                <h2>
                  Trình tự thực hiện
                  <span className="dem">{t.trinh_tu_thuc_hien.length} bước</span>
                </h2>
                {t.trinh_tu_thuc_hien.map((b, i) => (
                  <div className="buoc-item" key={i}>
                    <div className="buoc-so">{String(i + 1).padStart(2, "0")}</div>
                    <div className="buoc-noidung">
                      {b.truong_hop_xu_ly ? `[${b.truong_hop_xu_ly}] ` : ""}
                      {b.mo_ta_chi_tiet}
                    </div>
                  </div>
                ))}
              </section>
            ) : null}

            {t.cach_thuc_thuc_hien?.length ? (
              <section className="tt-khoi">
                <h2>
                  Cách thức thực hiện
                  <span className="dem">{t.cach_thuc_thuc_hien.length} hình thức</span>
                </h2>
                {t.cach_thuc_thuc_hien.map((c, i) => (
                  <div className="cttth-item" key={i}>
                    <div className="cttth-hang">
                      <span>{c.hinh_thuc_nop || "-"}</span>
                      <span className="thoigian">{c.thoi_gian}</span>
                    </div>
                    {c.phi_le_phi && (
                      <div className="cttth-mota phi-le-phi">{c.phi_le_phi}</div>
                    )}
                    {c.mo_ta && <div className="cttth-mota">{c.mo_ta}</div>}
                  </div>
                ))}
              </section>
            ) : null}

            {t.tphs?.length ? (
              <section className="tt-khoi">
                <h2>
                  Thành phần hồ sơ
                  <span className="dem">{t.tphs.length} loại giấy tờ</span>
                </h2>
                {t.tphs.map((h, i) => (
                  <div className="ho-so-item" key={i}>
                    <span className="ho-so-cham" aria-hidden="true">
                      •
                    </span>
                    <span>
                      {h.ten_giay_to}
                      {h.ban_chinh && <span className="ho-so-nhan">Bản chính</span>}
                      {h.ban_sao && <span className="ho-so-nhan">Bản sao</span>}
                    </span>
                  </div>
                ))}
              </section>
            ) : null}

            {t.kqth?.length ? (
              <section className="tt-khoi">
                <h2>
                  Kết quả thực hiện<span className="dem">{t.kqth.length}</span>
                </h2>
                {t.kqth.map((k, i) => (
                  <div className="kqth-item" key={i}>
                    <strong>{k.ten_ket_qua}</strong>
                    {k.co_quan_ban_hanh && (
                      <div className="kqth-co-quan">{k.co_quan_ban_hanh}</div>
                    )}
                  </div>
                ))}
              </section>
            ) : null}

            {t.ccpl?.length ? (
              <section className="tt-khoi">
                <h2>
                  Căn cứ pháp lý<span className="dem">{t.ccpl.length} văn bản</span>
                </h2>
                {t.ccpl.map((c, i) => (
                  <div className="ccpl-item" key={i}>
                    <div>
                      <span className="ccpl-so">{c.so_ky_hieu}</span>
                      {c.trich_yeu}
                    </div>
                    <div className="ccpl-phu">
                      {c.ngay_hieu_luc ? `Hiệu lực: ${c.ngay_hieu_luc}` : ""}
                      {c.dia_chi_truy_cap && (
                        <>
                          {c.ngay_hieu_luc ? " · " : ""}
                          <a
                            href={c.dia_chi_truy_cap}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Xem văn bản ↗
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            ) : null}
          </div>

          <aside>
            {t.link_truy_cap && (
              <div className="cta-dvc">
                <p className="cta-nhan">Nộp hồ sơ trực tuyến</p>
                <p>Chuyển đến Cổng Dịch vụ công Quốc gia để thực hiện thủ tục này.</p>
                <a
                  className="btn-taixuong"
                  href={t.link_truy_cap}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mở trên dichvucong.gov.vn ↗
                </a>
              </div>
            )}

            {lv && (
              <div className="tt-khoi tt-khoi-qr">
                <h2>QR lĩnh vực</h2>
                <Image
                  src={duongDan(`/qr/lv-${lv.slug}.png`)}
                  alt={`Mã QR lĩnh vực ${lv.ten_linh_vuc}`}
                  width={140}
                  height={140}
                  unoptimized
                />
                <p>
                  Xem tất cả {lv.so_luong_tthc} thủ tục thuộc &laquo;{lv.ten_linh_vuc}
                  &raquo;
                </p>
                <Link
                  href={`/linh-vuc/${lv.slug}`}
                  className="btn-taixuong btn-phu"
                >
                  Xem lĩnh vực
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>

      <SiteFooter ghiChu={`Mã thủ tục ${t.ma_tthc}`} />
    </>
  );
}

function ThongTin({
  nhan,
  giaTri,
  toanHang = false,
}: {
  nhan: string;
  giaTri: string;
  toanHang?: boolean;
}) {
  return (
    <div className={`thong-tin-o${toanHang ? " o-toan-hang" : ""}`}>
      <dt>{nhan}</dt>
      <dd>{giaTri || "-"}</dd>
    </div>
  );
}
