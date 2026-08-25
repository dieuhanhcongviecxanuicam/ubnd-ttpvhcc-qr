import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import BoLocDanhMuc from "@/components/BoLocDanhMuc";
import SiteFooter from "@/components/SiteFooter";
import {
  layChiMucTimKiem,
  layDanhSachCapThucHien,
  layMeta,
  layTatCaLinhVuc,
} from "@/lib/data";

export const metadata: Metadata = {
  title: "Tra cứu toàn bộ danh mục",
  description:
    "Tìm kiếm và lọc toàn bộ danh mục thủ tục hành chính theo tên, mã TTHC, " +
    "lĩnh vực và cấp thực hiện.",
};

export default function TrangDanhMuc() {
  const meta = layMeta();

  return (
    <>
      <main className="container" id="noi-dung">
        <section className="section">
          <nav className="duong-dan" aria-label="Đường dẫn">
            <Link href="/">Trang chủ</Link> / Danh mục
          </nav>
          <div className="section-head">
            <div>
              <h1>Toàn bộ danh mục thủ tục hành chính</h1>
              <p>
                {meta.tong_so_tthc} thủ tục thuộc {meta.tong_so_linh_vuc} lĩnh vực.
                Gõ không dấu vẫn tìm được - ví dụ &laquo;ho tich&raquo;, &laquo;dat dai&raquo;.
              </p>
            </div>
          </div>

          {/* useSearchParams cần Suspense khi trang được xuất tĩnh */}
          <Suspense fallback={<p className="dang-tai">Đang tải danh mục…</p>}>
            <BoLocDanhMuc
              danhSach={layChiMucTimKiem()}
              danhSachLinhVuc={layTatCaLinhVuc()}
              danhSachCap={layDanhSachCapThucHien()}
            />
          </Suspense>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
