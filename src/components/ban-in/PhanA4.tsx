import Image from "next/image";
import { duongDan, KHAU_HIEU, LIEN_HE, SITE_URL } from "@/lib/site-config";
import s from "./ban-in.module.css";

/** Dải đầu dùng chung cho tờ nhóm và tem mã QR khổ A4. */
export function DauA4({ loading }: { loading: "eager" | "lazy" }) {
  return (
    <header className={s.a4Dau}>
      <Image
        className={s.a4Logo}
        src={duongDan("/brand/logo-in.png")}
        alt=""
        width={1200}
        height={1200}
        loading={loading}
        unoptimized
      />
      <p>
        <strong>Bảng niêm yết thủ tục hành chính</strong>
        <span>
          {LIEN_HE.coQuan} · {KHAU_HIEU.phucVu}
        </span>
      </p>
    </header>
  );
}

/** Dải cuối dùng chung: số hỗ trợ và địa chỉ tra cứu. */
export function CuoiA4() {
  return (
    <footer className={s.a4Chan}>
      <span>
        Hỗ trợ, hướng dẫn: <strong>{LIEN_HE.hotline}</strong>
      </span>
      <span>
        Tra cứu: <strong>{SITE_URL.replace(/^https?:\/\//, "")}</strong>
      </span>
    </footer>
  );
}
