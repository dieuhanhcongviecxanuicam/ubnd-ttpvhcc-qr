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

Cần biến môi trường CLOUDFLARE_API_TOKEN với quyền:
    Zone / Zone / Read          (tra zone id)
    Zone / Cache Rules / Edit   (đặt luật)

Cách dùng:
    export CLOUDFLARE_API_TOKEN=...
    python3 scripts/cau-hinh-cloudflare.py              # xem trước
    python3 scripts/cau-hinh-cloudflare.py --ap-dung    # ghi thật
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

GOC_DU_AN = Path(__file__).resolve().parent.parent
API = "https://api.cloudflare.com/client/v4"

# Dấu nhận biết luật do script này quản lý, để chạy lại không tạo trùng và
# không đụng vào luật do người khác đặt tay.
DAU = "[ubnd-ttpvhcc-qr]"

TTL_TINH = 31536000    # một năm cho file có băm nội dung
TTL_TRANG = 3600       # một giờ ở biên cho trang; xoá cache lúc triển khai là hết cũ


def ten_mien() -> str:
    """Đọc tên miền từ public/CNAME - nguồn sự thật đã có sẵn trong kho."""
    return (GOC_DU_AN / "public" / "CNAME").read_text(encoding="utf-8").strip()


def goi(duong_dan: str, token: str, method: str = "GET", than=None,
        cho_phep_404: bool = False) -> dict:
    yc = urllib.request.Request(
        f"{API}{duong_dan}",
        method=method,
        data=json.dumps(than).encode() if than is not None else None,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(yc, timeout=60) as p:
            return json.loads(p.read())
    except urllib.error.HTTPError as loi:
        kq = json.loads(loi.read() or b"{}")
        # Zone chưa có luật nào trong phase này thì Cloudflare trả 404 - đó là
        # trạng thái bình thường, không phải lỗi.
        if loi.code == 404 and cho_phep_404:
            return {"result": {}}
        loi_ct = "; ".join(x.get("message", "") for x in kq.get("errors", []))
        print(f"LỖI API {loi.code} khi {method} {duong_dan}: {loi_ct}", file=sys.stderr)
        if loi.code in (401, 403):
            print("  Token thiếu quyền hoặc sai. Cần Zone/Zone/Read và "
                  "Zone/Cache Rules/Edit.", file=sys.stderr)
        raise SystemExit(1)


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
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    if not token:
        print("Thiếu CLOUDFLARE_API_TOKEN.\n"
              "Tạo tại Cloudflare > My Profile > API Tokens, quyền:\n"
              "  Zone / Zone / Read\n"
              "  Zone / Cache Rules / Edit\n"
              "rồi: export CLOUDFLARE_API_TOKEN=...", file=sys.stderr)
        return 1

    mien = ten_mien()
    # Zone của Cloudflare là tên miền GỐC (`xanuicam.vn`), không phải subdomain
    # mà site chạy trên đó (`ttpvhcc.xanuicam.vn`). Nên phải duyệt danh sách zone
    # rồi chọn zone là hậu tố dài nhất của tên miền, chứ không tra thẳng theo tên.
    kq = goi("/zones?per_page=50", token)
    ung_vien = [z for z in (kq.get("result") or [])
                if mien == z["name"] or mien.endswith("." + z["name"])]
    if not ung_vien:
        thay = ", ".join(z["name"] for z in (kq.get("result") or [])) or "(không có)"
        print(f"Không tìm thấy zone chứa {mien}. Token thấy các zone: {thay}",
              file=sys.stderr)
        return 1
    z = max(ung_vien, key=lambda x: len(x["name"]))
    zone = z["id"]
    print(f"Zone {z['name']} (gói {z.get('plan', {}).get('name', '?')}) cho {mien}: {zone}")

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

    goi(duong, token, "PUT", {"rules": cuoi})
    print(f"\nĐã ghi {len(cuoi)} luật.")
    print("Kiểm lại sau vài giây:")
    print(f"  curl -sI https://{mien}/ | grep -i cf-cache-status")
    print("  Mong đợi: HIT (hoặc MISS ở lượt đầu, rồi HIT ở lượt sau) thay vì DYNAMIC.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
