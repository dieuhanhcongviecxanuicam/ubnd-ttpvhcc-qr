import Image from "next/image";
import type { ThongKeNhom } from "@/lib/data";
import { duongDan, KHAU_HIEU, LIEN_HE, SITE_URL } from "@/lib/site-config";
import { catNgan } from "@/lib/text";
import { IconHoTro } from "./BieuTuong";
import s from "./ban-in.module.css";

/** Số lĩnh vực in trong mỗi thẻ nhóm - mẫu bảng giấy của đơn vị in 5 dòng. */
const SO_DONG_LINH_VUC = 5;
/** Cắt tên lĩnh vực để mỗi dòng nằm gọn một hàng trong thẻ rộng khoảng 160 mm. */
const DAI_TOI_DA_TEN = 44;

/**
 * Bảng niêm yết tổng khổ A1 ngang (841 × 594 mm), dựng theo bảng giấy mẫu của
 * đơn vị (docs/mau-tham-khao-ttpvhcc.png): dải tiêu đề đỏ, lưới thẻ nhóm, dải chân.
 *
 * 13 nhóm + ô hướng dẫn + ô số liệu = 15 ô, vừa khít lưới 5 × 3.
 */
export default function BangNiemYet({
  nhom,
  tongTthc,
  tongLinhVuc,
  taiNgay = false,
}: {
  nhom: ThongKeNhom[];
  tongTthc: number;
  tongLinhVuc: number;
  /** Bản dựng PDF phải tải ảnh ngay: ảnh tải lười có thể chưa kịp hiện lúc chụp PDF. */
  taiNgay?: boolean;
}) {
  const loading = taiNgay ? "eager" : "lazy";

  return (
    <article className={`${s.to} ${s.toBang}`}>
      <header className={s.bangDau}>
        <div className={s.bangLogo}>
          <Image
            className={s.bangLogoAnh}
            src={duongDan("/brand/logo-in.png")}
            alt=""
            width={1200}
            height={1200}
            loading={loading}
            unoptimized
          />
          <p>
            <strong>Hành chính công</strong>
            <span>Vì Nhân dân phục vụ</span>
          </p>
        </div>
        <h2 className={s.bangTieuDe}>
          Bảng niêm yết các thủ tục hành chính
          <span>thuộc phạm vi giải quyết của {LIEN_HE.coQuan}</span>
        </h2>
        <p className={s.bangKhauHieu}>{KHAU_HIEU.phucVu}</p>
      </header>

      <div className={s.bangLuoi}>
        {nhom.map((tk) => {
          const hien = tk.linhVuc.slice(0, SO_DONG_LINH_VUC);
          const conLai = tk.soLinhVuc - hien.length;
          return (
            <section key={tk.nhom.id} className={s.the} data-nhom={tk.nhom.id}>
              <div className={s.theDau}>
                <p>Lĩnh vực</p>
                <h3>{tk.nhom.ten}</h3>
              </div>
              <div className={s.theAnh}>
                <Image
                  className={s.theHinh}
                  src={duongDan(`/minh-hoa/${tk.nhom.hinh}`)}
                  alt=""
                  width={240}
                  height={160}
                  loading={loading}
                  unoptimized
                />
                <Image
                  className={s.theQr}
                  src={duongDan(`/qr/nhom-${tk.nhom.id}.svg`)}
                  alt={`Mã QR nhóm ${tk.nhom.ten}`}
                  width={300}
                  height={300}
                  loading={loading}
                  unoptimized
                />
              </div>
              <ol className={s.theDs}>
                {hien.map((lv) => (
                  <li key={lv.slug}>{catNgan(lv.ten_linh_vuc, DAI_TOI_DA_TEN)}</li>
                ))}
              </ol>
              {conLai > 0 && <p className={s.theCon}>và {conLai} lĩnh vực khác</p>}
              <p className={s.theNut}>Quét mã để xem {tk.soTthc} thủ tục</p>
            </section>
          );
        })}

        <section className={s.the}>
          <div className={s.theDau}>
            <p>Hướng dẫn</p>
            <h3>Tra cứu bằng mã QR</h3>
          </div>
          <ol className={s.huongDan}>
            <li>Mở camera điện thoại hoặc ứng dụng Zalo</li>
            <li>Quét mã QR của nhóm lĩnh vực cần làm thủ tục</li>
            <li>Chọn lĩnh vực, xem thủ tục và thành phần hồ sơ</li>
            <li>Nộp hồ sơ trực tuyến hoặc tại bộ phận một cửa</li>
          </ol>
        </section>

        <section className={s.the}>
          <div className={s.theDau}>
            <p>Toàn bộ danh mục</p>
            <h3>{LIEN_HE.diaBan}</h3>
          </div>
          <dl className={s.soLieu}>
            <div>
              <dt>Thủ tục hành chính</dt>
              <dd>{tongTthc}</dd>
            </div>
            <div>
              <dt>Lĩnh vực</dt>
              <dd>{tongLinhVuc}</dd>
            </div>
            <div>
              <dt>Nhóm lĩnh vực</dt>
              <dd>{nhom.length}</dd>
            </div>
          </dl>
          <p className={s.theNut}>Liên kết Cổng Dịch vụ công Quốc gia</p>
        </section>
      </div>

      <footer className={s.bangChan}>
        <div className={s.chanKhoi}>
          <Image
            className={s.chanQr}
            src={duongDan("/qr/dich-vu-cong.svg")}
            alt="Mã QR Cổng Dịch vụ công Quốc gia"
            width={300}
            height={300}
            loading={loading}
            unoptimized
          />
          <p>
            <strong>Dịch vụ công trực tuyến</strong>
            <span>Nộp hồ sơ mọi lúc, mọi nơi</span>
            <span className={s.chanUrl}>{LIEN_HE.dichVuCongUrl.replace(/^https?:\/\//, "")}</span>
          </p>
        </div>
        <p className={s.chanKhauHieu}>{KHAU_HIEU.caiCach}</p>
        <div className={s.chanKhoi}>
          <span className={s.chanIcon} aria-hidden="true">
            <IconHoTro />
          </span>
          <p>
            <strong>Hỗ trợ, hướng dẫn</strong>
            <span className={s.chanHotline}>{LIEN_HE.hotline}</span>
          </p>
        </div>
        <div className={s.chanKhoi}>
          <Image
            className={s.chanQr}
            src={duongDan("/qr/master.svg")}
            alt="Mã QR trang tra cứu thủ tục hành chính"
            width={300}
            height={300}
            loading={loading}
            unoptimized
          />
          <p>
            <strong>Truy cập website</strong>
            <span className={s.chanUrl}>{SITE_URL.replace(/^https?:\/\//, "")}</span>
          </p>
        </div>
      </footer>
    </article>
  );
}
