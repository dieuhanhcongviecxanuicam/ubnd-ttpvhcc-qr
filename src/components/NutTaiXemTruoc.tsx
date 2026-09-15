"use client";

import Image from "next/image";
import { useId, useRef } from "react";
import type { DuLieuTaiVe } from "@/lib/types";

/**
 * Nút tải về có bước xem trước: bấm nút mở cửa sổ cho xem tệp và các thông tin
 * cần đối chiếu (mã QR mở tới đâu, định dạng, dung lượng), rồi mới tải.
 *
 * Vì sao không tải thẳng: mã QR in ra dán tại quầy là thứ không sửa được sau
 * khi dán. Một bước nhìn lại trước khi tải rẻ hơn nhiều so với in nhầm cả xấp.
 *
 * Dùng <dialog> gốc của trình duyệt chứ không tự dựng lớp phủ: nó có sẵn bẫy
 * focus, đóng bằng phím Esc, trả focus về nút đã mở, và che phần còn lại của
 * trang khỏi trình đọc màn hình - bốn thứ tự dựng rất dễ sai.
 *
 * Xem trước bằng ẢNH chứ không nhúng PDF: CSP của site đặt frame-src 'none' và
 * object-src 'none', và không nới chính sách chỉ để hiện một khung xem trước.
 */
export default function NutTaiXemTruoc({
  nhan,
  phu = false,
  href,
  tenTep,
  tieuDe,
  anhXemTruoc,
  thongTin,
  ghiChu,
}: DuLieuTaiVe & { nhan: string; phu?: boolean }) {
  const hop = useRef<HTMLDialogElement>(null);
  const idTieuDe = useId();
  const dinhDang = tenTep.split(".").pop()?.toUpperCase() ?? "";

  return (
    <>
      <button
        type="button"
        className={phu ? "btn-taixuong btn-phu" : "btn-taixuong"}
        aria-haspopup="dialog"
        onClick={() => hop.current?.showModal()}
      >
        {nhan}
      </button>

      <dialog
        ref={hop}
        className="hop-xem-truoc"
        aria-labelledby={idTieuDe}
        // Bấm vào vùng tối bên ngoài nội dung thì đóng. Nội dung nằm trong một
        // khối con phủ kín hộp, nên chỉ lượt bấm trúng nền mới có target là hộp.
        onClick={(e) => {
          if (e.target === hop.current) hop.current.close();
        }}
      >
        <div className="hop-xem-truoc-noi-dung">
          <div className="hop-xem-truoc-dau">
            <h2 id={idTieuDe}>{tieuDe}</h2>
            <button
              type="button"
              className="hop-dong"
              aria-label="Đóng cửa sổ xem trước"
              onClick={() => hop.current?.close()}
            >
              ×
            </button>
          </div>

          {anhXemTruoc && (
            <div className="hop-xem-truoc-anh">
              <Image
                src={anhXemTruoc}
                alt={`Xem trước ${tieuDe}`}
                width={480}
                height={480}
                unoptimized
              />
            </div>
          )}

          <dl className="hop-xem-truoc-tt">
            {thongTin.map((t) => (
              <div key={t.nhan}>
                <dt>{t.nhan}</dt>
                <dd>{t.giaTri}</dd>
              </div>
            ))}
          </dl>

          {ghiChu && <p className="hop-xem-truoc-ghi-chu">{ghiChu}</p>}

          <div className="hop-xem-truoc-nut">
            <button
              type="button"
              className="btn-taixuong btn-phu"
              onClick={() => hop.current?.close()}
            >
              Đóng
            </button>
            <a
              className="btn-taixuong"
              href={href}
              download={tenTep}
              onClick={() => hop.current?.close()}
            >
              Tải về {dinhDang}
            </a>
          </div>
        </div>
      </dialog>
    </>
  );
}
