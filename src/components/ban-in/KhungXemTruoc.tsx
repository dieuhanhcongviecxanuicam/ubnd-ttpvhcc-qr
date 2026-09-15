"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import s from "./ban-in.module.css";

const PX_MOI_MM = 96 / 25.4;

/**
 * Thu nhỏ một tờ in (kích thước thật tính bằng mm) cho vừa khung trên màn hình.
 *
 * Tờ bên trong luôn giữ đúng kích thước in - chỉ khung ngoài co giãn bằng
 * transform. Nhờ vậy bản xem trước và PDF là CÙNG một bố cục: khi in, CSS bỏ
 * transform và tờ trở về cỡ thật (xem @media print trong ban-in.module.css).
 */
export default function KhungXemTruoc({
  rongMm,
  caoMm,
  children,
  anVoiTroNang = false,
  tiLeBanDau = 0.3,
}: {
  rongMm: number;
  caoMm: number;
  children: ReactNode;
  /** Bản xem trước cạnh nút tải chỉ là bản sao minh hoạ - ẩn khỏi trình đọc màn hình để không đọc lặp hàng chục mã QR. */
  anVoiTroNang?: boolean;
  tiLeBanDau?: number;
}) {
  const khung = useRef<HTMLDivElement>(null);
  const [tiLe, setTiLe] = useState(tiLeBanDau);
  const rongPx = rongMm * PX_MOI_MM;
  const caoPx = caoMm * PX_MOI_MM;

  useEffect(() => {
    const el = khung.current;
    if (!el) return;
    const quanSat = new ResizeObserver(([muc]) => {
      setTiLe(Math.min(1, muc.contentRect.width / rongPx));
    });
    quanSat.observe(el);
    return () => quanSat.disconnect();
  }, [rongPx]);

  return (
    <div
      ref={khung}
      className={s.khung}
      style={{ maxWidth: rongPx, height: Math.ceil(caoPx * tiLe) }}
      aria-hidden={anVoiTroNang || undefined}
    >
      <div
        className={s.khungNoi}
        style={{ width: rongPx, height: caoPx, transform: `scale(${tiLe})` }}
      >
        {children}
      </div>
    </div>
  );
}
