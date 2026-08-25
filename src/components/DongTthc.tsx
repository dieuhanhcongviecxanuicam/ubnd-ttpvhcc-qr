import Link from "next/link";
import type { TthcTomTat } from "@/lib/types";

/** Một dòng thủ tục trong danh sách kết quả. */
export default function DongTthc({
  tthc,
  phu = "linh_vuc",
}: {
  tthc: TthcTomTat;
  /** Dòng chú thích phụ: tên lĩnh vực (trang danh mục) hay cấp thực hiện (trang lĩnh vực). */
  phu?: "linh_vuc" | "cap_thuc_hien";
}) {
  return (
    <Link className="dong-tthc" href={`/tthc/${tthc.ma_tthc}`}>
      <span className="ma">{tthc.ma_tthc}</span>
      <span>
        <span className="ten">{tthc.ten_tthc}</span>
        <span className="linh-vuc-nhan">
          {phu === "linh_vuc" ? tthc.linh_vuc : tthc.cap_thuc_hien}
        </span>
      </span>
      <span className="mui-ten" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
