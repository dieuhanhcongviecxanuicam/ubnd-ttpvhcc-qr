import { layMeta } from "@/lib/data";
import { SITE_CONFIG } from "@/lib/site-config";

/**
 * Chân trang — mọi số liệu đọc từ data/meta.json chứ không viết cứng,
 * để khi cập nhật danh mục TTHC thì con số tự khớp theo.
 */
export default function SiteFooter({ ghiChu }: { ghiChu?: string }) {
  const meta = layMeta();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>
          Dữ liệu tổng hợp từ{" "}
          <a href={SITE_CONFIG.nguonDuLieuUrl} target="_blank" rel="noopener noreferrer">
            {SITE_CONFIG.nguonDuLieu}
          </a>{" "}
          · Cập nhật {meta.ngay_xuat}
        </span>
        <span>
          {ghiChu ?? `${meta.tong_so_tthc} TTHC · ${meta.tong_so_linh_vuc} lĩnh vực`}
        </span>
      </div>
    </footer>
  );
}
