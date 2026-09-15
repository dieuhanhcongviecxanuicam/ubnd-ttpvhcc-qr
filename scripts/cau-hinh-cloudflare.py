#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Áp Cache Rule của Cloudflare cho site, bằng API thay vì bấm tay trên dashboard.

Vì sao cần: Cloudflare mặc định chỉ cache URL có phần mở rộng tĩnh. Dự án dùng
`trailingSlash: false` nên đường dẫn trang không có phần mở rộng, và Cloudflare
xếp chúng vào nội dung động - `cf-cache-status: DYNAMIC` trên MỌI trang, tức mỗi
lần tải trang đều đi trọn một vòng tới GitHub Pages. Đó là lời giải cho triệu
chứng "reload trang thì chậm". Chi tiết ở docs/HIEU-NANG.md mục 5.2.

Script này đặt hai luật, loại trừ nhau nên không phụ thuộc thứ tự áp dụng:

  1. `/_next/static/*` - tên file đã có băm nội dung nên bất biến, cache một năm
     ở cả biên lẫn trình duyệt. GitHub Pages đặt cứng 4 giờ và không cho sửa.
  2. Mọi đường dẫn còn lại - cho phép cache ở biên với thời hạn ngắn. Thời hạn
     phía trình duyệt vẫn theo máy chủ gốc: xoá cache biên thì làm được ngay khi
     triển khai, còn cache trong trình duyệt người dân thì không.

MẶC ĐỊNH CHỈ IN RA DỰ ĐỊNH, KHÔNG GHI GÌ. Muốn ghi thật phải thêm --ap-dung.

Script còn nhận --xoa-cache, dùng bởi job "Xoá cache Cloudflare" trong
.github/workflows/deploy.yml. Cố ý gộp vào đây thay vì viết lại bằng curl trong
workflow: bản đầu nhân đôi phần tra zone và đã sai đúng chỗ đó - tra theo tên
miền đầy đủ `ttpvhcc.xanuicam.vn` trong khi zone của Cloudflare là tên miền gốc
`xanuicam.vn`, khiến job xoá cache trượt ngay lượt triển khai đầu tiên.

Phần gọi API và tra zone nằm ở scripts/cloudflare_chung.py, dùng chung với
scripts/bao-ve-cloudflare.py. Chỉ dùng thư viện chuẩn, nên chạy được ngay trên
runner mà không cần cài gì.

Cần biến môi trường CLOUDFLARE_API_TOKEN với quyền:
    Zone / Zone / Read          (tra zone id - luôn cần)
    Zone / Cache Rules / Edit   (cho --ap-dung)
    Zone / Cache Purge / Purge  (cho --xoa-cache)

Cách dùng:
    export CLOUDFLARE_API_TOKEN=...
    python3 scripts/cau-hinh-cloudflare.py              # xem trước
    python3 scripts/cau-hinh-cloudflare.py --ap-dung    # đặt Cache Rule
    python3 scripts/cau-hinh-cloudflare.py --xoa-cache  # xoá toàn bộ cache
"""
from __future__ import annotations

import sys

from cloudflare_chung import DAU, doc_token, goi_hoac_dung as goi, ten_mien, tra_zone

TTL_TINH = 31536000    # một năm cho file có băm nội dung
TTL_TRANG = 3600       # một giờ ở biên cho trang; xoá cache lúc triển khai là hết cũ


def luat_mong_muon(mien: str) -> list[dict]:
    trong_static = 'starts_with(http.request.uri.path, "/_next/static/")'
    thuoc_mien = f'http.host eq "{mien}"'
    return [
        {
            "description": f"{DAU} file tĩnh có băm nội dung - cache một năm",
            "expression": f"({thuoc_mien} and {trong_static})",
            "action": "set_cache_settings",
            "action_parameters": {
                "cache": True,
                "edge_ttl": {"mode": "override_origin", "default": TTL_TINH},
                "browser_ttl": {"mode": "override_origin", "default": TTL_TINH},
            },
        },
        {
            "description": f"{DAU} trang HTML - cho phép cache ở biên",
            "expression": f"({thuoc_mien} and not {trong_static})",
            "action": "set_cache_settings",
            "action_parameters": {
                "cache": True,
                "edge_ttl": {"mode": "override_origin", "default": TTL_TRANG},
                # Giữ nguyên thời hạn phía trình duyệt theo máy chủ gốc: cache ở
                # biên thì xoá được lúc triển khai, cache trong máy người dân thì không.
                "browser_ttl": {"mode": "respect_origin"},
            },
        },
    ]


def main() -> int:
    ap_dung = "--ap-dung" in sys.argv
    xoa_cache = "--xoa-cache" in sys.argv
    token = doc_token("    Zone / Zone / Read\n"
                      "    Zone / Cache Rules / Edit   (cho --ap-dung)\n"
                      "    Zone / Cache Purge / Purge  (cho --xoa-cache)")

    mien = ten_mien()
    zone, ten_zone = tra_zone(token, mien)

    if xoa_cache:
        goi(f"/zones/{zone}/purge_cache", token, "POST", {"purge_everything": True},
            goi_y_quyen="    Zone / Cache Purge / Purge")
        print(f"Đã xoá toàn bộ cache của zone {ten_zone}.")
        return 0

    print(f"Zone {ten_zone} cho {mien}: {zone}")

    duong = f"/zones/{zone}/rulesets/phases/http_request_cache_settings/entrypoint"
    hien_co = (goi(duong, token, cho_phep_404=True)["result"] or {}).get("rules") or []
    khac = [r for r in hien_co if DAU not in (r.get("description") or "")]
    cua_ta = [r for r in hien_co if DAU in (r.get("description") or "")]

    print(f"\nLuật đang có trong phase cache: {len(hien_co)}"
          f" ({len(cua_ta)} của script này, {len(khac)} do nơi khác đặt)")
    for r in khac:
        print(f"  GIỮ NGUYÊN: {r.get('description') or '(không mô tả)'}")

    moi = luat_mong_muon(mien)
    print(f"\nSẽ đặt {len(moi)} luật:")
    for r in moi:
        ttl = r["action_parameters"]["edge_ttl"]["default"]
        print(f"  - {r['description']}")
        print(f"      khi: {r['expression']}")
        print(f"      cache ở biên {ttl} giây")

    # Luật của script đặt TRƯỚC, luật của nơi khác giữ nguyên phía sau.
    cuoi = moi + khac

    if not ap_dung:
        print("\nĐây mới là xem trước. Thêm --ap-dung để ghi thật.")
        return 0

    goi(duong, token, "PUT", {"rules": cuoi},
        goi_y_quyen="    Zone / Cache Rules / Edit")
    print(f"\nĐã ghi {len(cuoi)} luật.")
    print("Kiểm lại sau vài giây:")
    print(f"  curl -sI https://{mien}/ | grep -i cf-cache-status")
    print("  Mong đợi: HIT (hoặc MISS ở lượt đầu, rồi HIT ở lượt sau) thay vì DYNAMIC.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
