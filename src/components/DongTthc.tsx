import Link from "next/link";
import type { TthcTomTat } from "@/lib/types";
import ChuKhop from "./ChuKhop";

/** Một dòng thủ tục trong danh sách kết quả. */
export default function DongTthc({
  tthc,
  phu = "linh_vuc",
  tuKhoa = "",
}: {
  tthc: TthcTomTat;
  /** Dòng chú thích phụ: tên lĩnh vực (trang danh mục) hay cấp thực hiện (trang lĩnh vực). */
  phu?: "linh_vuc" | "cap_thuc_hien";
  /** Từ khoá đang gõ - phần khớp sẽ được tô sáng. */
  tuKhoa?: string;
}) {
  const chu_thich = phu === "linh_vuc" ? tthc.linh_vuc : tthc.cap_thuc_hien;

  return (
    <Link className="dong-tthc" href={`/tthc/${tthc.ma_tthc}`}>
      <span className="ma">
        <ChuKhop chuoi={tthc.ma_tthc} tuKhoa={tuKhoa} />
      </span>
      <span>
        <span className="ten">
          <ChuKhop chuoi={tthc.ten_tthc} tuKhoa={tuKhoa} />
        </span>
        <span className="linh-vuc-nhan">
          <ChuKhop chuoi={chu_thich} tuKhoa={tuKhoa} />
        </span>
      </span>
      <span className="mui-ten" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
