#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Dựng lớp chống DDoS, bot và spam IP cho site, bằng API thay vì bấm tay dashboard.

VÌ SAO Ở ĐÂY CHỨ KHÔNG PHẢI TRONG MÃ NGUỒN TRANG
------------------------------------------------
Site là tệp tĩnh trên GitHub Pages: không máy chủ ứng dụng, không cơ sở dữ liệu,
không biểu mẫu, không phiên đăng nhập. Nghĩa là mã nguồn trang KHÔNG có chỗ nào
để cài đếm lượt hay chặn IP - request bị chặn hay không đã được quyết định xong ở
Cloudflare, trước khi tới máy chủ gốc. Mọi biện pháp chống dội request vì vậy chỉ
có một chỗ đúng để đặt: tầng biên. Script này đưa phần cấu hình đó vào kho mã để
nó được rà soát, ghi nhật ký và dựng lại được, thay vì nằm trong trí nhớ của
người từng bấm dashboard.

BỐN LỚP ĐƯỢC DỰNG
-----------------
1. Luật WAF (phase http_request_firewall_custom), theo đúng thứ tự:
   a. Bot tìm kiếm đã xác minh (Googlebot, Bingbot...) - bỏ qua các luật sau.
      Đặt ĐẦU TIÊN có chủ đích: đây là trang tra cứu thủ tục hành chính, chặn
      nhầm bot tìm kiếm là tự cắt đường người dân tìm thấy trang.
   b. Chặn thẳng những đường dẫn mà site tĩnh KHÔNG BAO GIỜ có: /wp-admin,
      /.env, /.git, *.php... Đây là toàn bộ lưu lượng quét lỗ hổng tự động -
      chặn ở biên thì chúng không tốn của ta một byte băng thông gốc nào.
   c. Điểm đe doạ cao (cf.threat_score) - bắt xác minh, không chặn thẳng. Điểm
      đe doạ có thể sai; người dân dùng chung IP nhà mạng hoặc mạng cơ quan
      không được phép mất quyền tra cứu chỉ vì một máy khác cùng IP từng xấu.
2. Luật giới hạn tần suất (phase http_ratelimit): một IP dội quá ngưỡng thì phải
   qua trang xác minh trong một khoảng, sau đó tự trở lại bình thường.
3. Bot Fight Mode: Cloudflare tự nhận diện bot giả mạo trình duyệt.
4. Cài đặt zone: HSTS, TLS tối thiểu 1.2, luôn dùng HTTPS, Browser Integrity
   Check.

CÒN "TRANG XÁC MINH BẢO MẬT" NHƯ grok.com THÌ SAO
-------------------------------------------------
Đó là Under Attack Mode: MỌI người truy cập đều phải qua một trang xác minh vài
giây trước khi xem được nội dung. Script có sẵn công tắc (--che-do-tan-cong bat),
nhưng CỐ Ý KHÔNG bật thường trực, vì đây là trang dịch vụ công:

  - Người dân quét mã QR tại quầy phải chờ thêm vài giây mỗi lần mở trang, và
    trên máy cũ hoặc trình duyệt hiếm, bước xác minh có thể thất bại hẳn - khi
    đó họ mất luôn đường tra cứu thủ tục.
  - Trình đọc màn hình và người dùng bàn phím gặp thêm một rào cản không cần
    thiết, trong khi dự án cam kết WCAG 2.1 AA.
  - Bot tìm kiếm bị chặn, trang rụng khỏi kết quả tìm kiếm.
  - Nội dung ở đây là thông tin công khai bắt buộc phải niêm yết. Bắt người dân
    chứng minh mình không phải máy để đọc thông tin công khai là đặt sai ưu tiên.

Nên: ngày thường chạy bốn lớp ở trên - vốn đã chặn được lưu lượng lạm dụng mà
người dân không thấy gì; khi thật sự bị tấn công thì bật Under Attack Mode bằng
một lệnh (hoặc bằng workflow "Chế độ chống tấn công" trên GitHub), và TẮT ngay
khi hết đợt.

MẶC ĐỊNH CHỈ ĐỌC VÀ IN RA DỰ ĐỊNH, KHÔNG GHI GÌ. Muốn ghi thật phải thêm --ap-dung.

Cần biến môi trường CLOUDFLARE_API_TOKEN với quyền:
    Zone / Zone / Read              (tra zone - luôn cần)
    Zone / Zone Settings / Read     (cho --kiem-tra)
    Zone / Zone Settings / Edit     (cho --ap-dung và --che-do-tan-cong)
    Zone / Zone WAF / Edit          (cho --ap-dung: luật WAF và giới hạn tần suất)
    Zone / Bot Management / Edit    (cho --ap-dung: Bot Fight Mode; có thể không
                                     cấp được trên gói Free - script tự bỏ qua)

Cách dùng:
    export CLOUDFLARE_API_TOKEN=...
    python3 scripts/bao-ve-cloudflare.py                      # xem trước
    python3 scripts/bao-ve-cloudflare.py --kiem-tra           # chỉ đọc, chấm trạng thái
    python3 scripts/bao-ve-cloudflare.py --ap-dung            # dựng bốn lớp bảo vệ
    python3 scripts/bao-ve-cloudflare.py --che-do-tan-cong bat
    python3 scripts/bao-ve-cloudflare.py --che-do-tan-cong tat
"""
from __future__ import annotations

import sys

from cloudflare_chung import (
    DAU,
    LoiAPI,
    doc_token,
    goi,
    goi_hoac_dung,
    ten_mien,
    tra_zone,
)

QUYEN = (
    "    Zone / Zone / Read\n"
    "    Zone / Zone Settings / Read và Edit\n"
    "    Zone / Zone WAF / Edit\n"
    "    Zone / Bot Management / Edit (tuỳ chọn)"
)

# ---------------------------------------------------------------------------
# Ngưỡng giới hạn tần suất
#
# 60 request / 10 giây từ MỘT IP. Con số đặt theo hành vi thật của trang chứ
# không lấy tròn: một lượt mở trang chi tiết tải khoảng 10-14 tệp (HTML, một
# file chữ, mã QR, vài hình minh hoạ), nên người dân bấm nhanh liên tiếp vẫn
# cách ngưỡng rất xa. Cán bộ một cửa mở hàng loạt tab để in mã QR cũng chỉ chạm
# tới vài chục request. Vượt 60 trong 10 giây không còn là người đọc trang.
#
# Hết 60 giây là tự trở lại bình thường - không có danh sách chặn vĩnh viễn nào
# để quên xoá, và người bị chặn nhầm chỉ phải đợi một phút.
# ---------------------------------------------------------------------------
NGUONG_REQUEST = 60
KHOANG_DEM = 10
THOI_GIAN_CHAN = 60

# Đuôi và thư mục mà một site tĩnh không bao giờ có. Danh sách cố ý ngắn: chỉ
# gồm thứ chắc chắn không tồn tại, để không có cách nào chặn nhầm người dân.
DUONG_DAN_LA = [
    "/wp-admin", "/wp-login", "/wp-content", "/wp-includes", "/xmlrpc.php",
    "/.env", "/.git", "/.aws", "/.ssh", "/vendor/", "/cgi-bin/",
    "/phpmyadmin", "/administrator", "/.well-known/acme-challenge/../",
]
DUOI_LA = [".php", ".asp", ".aspx", ".jsp", ".cgi", ".sql", ".bak", ".old", ".env"]

# Cài đặt zone. Giá trị chọn theo mục 3 của docs/BAO-MAT.md.
CAI_DAT_ZONE = {
    "always_use_https": "on",
    "automatic_https_rewrites": "on",
    "min_tls_version": "1.2",
    "tls_1_3": "on",
    # Browser Integrity Check: chặn client có dấu hiệu giả mạo trình duyệt. Người
    # dùng thật không thấy gì.
    "browser_check": "on",
    # Mức bảo mật thường trực. "medium" là mức Cloudflare chỉ thách thức lưu
    # lượng có tiếng xấu; KHÔNG đặt "under_attack" ở đây - xem phần đầu file.
    "security_level": "medium",
}

HSTS = {
    "strict_transport_security": {
        "enabled": True,
        "max_age": 31536000,
        "include_subdomains": True,
        "preload": True,
        "nosniff": True,
    }
}


def bieu_thuc_duong_dan_la() -> str:
    """Biểu thức WAF khớp các đường dẫn quét lỗ hổng, viết bằng lower() cho chắc."""
    duong = " or ".join(
        f'starts_with(lower(http.request.uri.path), "{d}")' for d in DUONG_DAN_LA
    )
    duoi = " or ".join(
        f'ends_with(lower(http.request.uri.path), "{d}")' for d in DUOI_LA
    )
    return f"({duong} or {duoi})"


def luat_waf(mien: str) -> list[dict]:
    thuoc_mien = f'http.host eq "{mien}"'
    return [
        {
            "description": f"{DAU} bot tìm kiếm đã xác minh - bỏ qua các luật sau",
            "expression": f"({thuoc_mien} and cf.client.bot)",
            "action": "skip",
            # Bỏ qua phần còn lại của chính bộ luật này, không bỏ qua lớp khác.
            "action_parameters": {"ruleset": "current"},
            "enabled": True,
        },
        {
            "description": f"{DAU} chặn đường dẫn quét lỗ hổng - site tĩnh không có",
            "expression": f"({thuoc_mien} and {bieu_thuc_duong_dan_la()})",
            "action": "block",
            "enabled": True,
        },
        {
            "description": f"{DAU} điểm đe doạ cao - bắt xác minh, không chặn thẳng",
            "expression": f"({thuoc_mien} and cf.threat_score gt 20)",
            "action": "managed_challenge",
            "enabled": True,
        },
    ]


def luat_tan_suat(mien: str) -> list[dict]:
    return [
        {
            "description": f"{DAU} một IP dội quá {NGUONG_REQUEST} request/"
                           f"{KHOANG_DEM}s - bắt xác minh {THOI_GIAN_CHAN}s",
            "expression": f'(http.host eq "{mien}")',
            "action": "managed_challenge",
            "ratelimit": {
                # Đếm theo IP và theo từng điểm biên. Cloudflare khuyến nghị kèm
                # cf.colo.id vì mỗi điểm biên đếm độc lập.
                "characteristics": ["ip.src", "cf.colo.id"],
                "period": KHOANG_DEM,
                "requests_per_period": NGUONG_REQUEST,
                "mitigation_timeout": THOI_GIAN_CHAN,
            },
            "enabled": True,
        }
    ]


def doc_luat(zone: str, token: str, phase: str) -> list[dict]:
    duong = f"/zones/{zone}/rulesets/phases/{phase}/entrypoint"
    kq = goi_hoac_dung(duong, token, cho_phep_404=True, goi_y_quyen=QUYEN)
    return (kq.get("result") or {}).get("rules") or []


def ghi_luat(zone: str, token: str, phase: str, moi: list[dict], ten_phase: str) -> None:
    """Ghi luật của ta lên đầu, giữ nguyên luật do nơi khác đặt ở phía sau."""
    hien_co = doc_luat(zone, token, phase)
    khac = [r for r in hien_co if DAU not in (r.get("description") or "")]
    cuoi = moi + [
        {k: v for k, v in r.items()
         if k in ("description", "expression", "action", "action_parameters",
                  "ratelimit", "enabled", "logging")}
        for r in khac
    ]
    duong = f"/zones/{zone}/rulesets/phases/{phase}/entrypoint"
    try:
        goi(duong, token, "PUT", {"rules": cuoi})
    except LoiAPI as loi:
        print(f"  LỖI khi ghi {ten_phase}: {loi.thong_diep}", file=sys.stderr)
        if "rate" in loi.thong_diep.lower() or loi.ma == 400:
            print("  Gói Free chỉ cho một luật giới hạn tần suất và giới hạn vài "
                  "tham số.\n  Xem thông điệp gốc ở trên rồi chỉnh NGUONG_REQUEST/"
                  "KHOANG_DEM/THOI_GIAN_CHAN.", file=sys.stderr)
        raise SystemExit(1) from None
    print(f"  Đã ghi {len(moi)} luật của kho mã vào {ten_phase}"
          f"{f', giữ nguyên {len(khac)} luật của nơi khác' if khac else ''}.")


def doc_cai_dat(zone: str, token: str, ten: str) -> str:
    """Đọc một cài đặt zone. Trả '(không đọc được)' thay vì dừng cả script."""
    try:
        kq = goi(f"/zones/{zone}/settings/{ten}", token)
        gt = (kq.get("result") or {}).get("value")
        return gt if isinstance(gt, str) else str(gt)
    except LoiAPI as loi:
        return f"(không đọc được: {loi.ma})"


def in_trang_thai(zone: str, token: str, mien: str) -> None:
    print(f"\nTrạng thái hiện tại của {mien}:")
    for ten in ("security_level", "always_use_https", "min_tls_version",
                "tls_1_3", "browser_check"):
        print(f"  {ten:26s} {doc_cai_dat(zone, token, ten)}")

    for phase, nhan in (("http_request_firewall_custom", "luật WAF"),
                        ("http_ratelimit", "luật giới hạn tần suất")):
        try:
            luat = doc_luat(zone, token, phase)
        except SystemExit:
            print(f"  {nhan:26s} (không đọc được)")
            continue
        cua_ta = [r for r in luat if DAU in (r.get("description") or "")]
        print(f"  {nhan:26s} {len(luat)} luật ({len(cua_ta)} của kho mã)")
        for r in luat:
            dau_hieu = "*" if DAU in (r.get("description") or "") else " "
            trang_thai = "" if r.get("enabled", True) else "  [đang tắt]"
            print(f"     {dau_hieu} {r.get('action'):18s}"
                  f" {(r.get('description') or '(không mô tả)')[:70]}{trang_thai}")


def dat_che_do_tan_cong(zone: str, token: str, bat: bool) -> int:
    muc = "under_attack" if bat else "medium"
    goi_hoac_dung(f"/zones/{zone}/settings/security_level", token, "PATCH",
                  {"value": muc}, goi_y_quyen=QUYEN)
    if bat:
        print("ĐÃ BẬT chế độ chống tấn công (Under Attack Mode).\n"
              "  Mọi người truy cập nay phải qua trang xác minh vài giây.\n"
              "  Bot tìm kiếm cũng bị chặn, nên TẮT ngay khi hết đợt tấn công:\n"
              "      python3 scripts/bao-ve-cloudflare.py --che-do-tan-cong tat")
    else:
        print("Đã tắt chế độ chống tấn công, mức bảo mật trở lại 'medium'.\n"
              "  Bốn lớp bảo vệ thường trực vẫn chạy.")
    return 0


def main() -> int:
    ap_dung = "--ap-dung" in sys.argv
    chi_kiem_tra = "--kiem-tra" in sys.argv

    che_do = None
    if "--che-do-tan-cong" in sys.argv:
        i = sys.argv.index("--che-do-tan-cong")
        gia_tri = sys.argv[i + 1] if i + 1 < len(sys.argv) else ""
        if gia_tri not in ("bat", "tat"):
            print("Dùng: --che-do-tan-cong bat   hoặc   --che-do-tan-cong tat",
                  file=sys.stderr)
            return 1
        che_do = gia_tri == "bat"

    token = doc_token(QUYEN)
    mien = ten_mien()
    zone, ten_zone = tra_zone(token, mien)
    print(f"Zone {ten_zone} cho {mien}: {zone}")

    if che_do is not None:
        return dat_che_do_tan_cong(zone, token, che_do)

    if chi_kiem_tra:
        in_trang_thai(zone, token, mien)
        return 0

    waf = luat_waf(mien)
    tan_suat = luat_tan_suat(mien)

    print(f"\nSẽ đặt {len(waf)} luật WAF:")
    for r in waf:
        print(f"  - [{r['action']}] {r['description']}")
        print(f"      khi: {r['expression'][:150]}")
    print(f"\nSẽ đặt {len(tan_suat)} luật giới hạn tần suất:")
    for r in tan_suat:
        rl = r["ratelimit"]
        print(f"  - [{r['action']}] {r['description']}")
        print(f"      đếm theo {', '.join(rl['characteristics'])};"
              f" {rl['requests_per_period']} request/{rl['period']}s;"
              f" giữ {rl['mitigation_timeout']}s")
    print("\nSẽ đặt cài đặt zone:")
    for k, v in CAI_DAT_ZONE.items():
        print(f"  - {k} = {v}")
    print("  - strict_transport_security = 1 năm, gồm subdomain, preload")
    print("  - Bot Fight Mode = bật")

    in_trang_thai(zone, token, mien)

    if not ap_dung:
        print("\nĐây mới là xem trước. Thêm --ap-dung để ghi thật.")
        return 0

    print("\nĐang ghi:")
    ghi_luat(zone, token, "http_request_firewall_custom", waf, "phase WAF")
    ghi_luat(zone, token, "http_ratelimit", tan_suat, "phase giới hạn tần suất")

    for ten, gt in CAI_DAT_ZONE.items():
        try:
            goi(f"/zones/{zone}/settings/{ten}", token, "PATCH", {"value": gt})
            print(f"  {ten} = {gt}")
        except LoiAPI as loi:
            print(f"  BỎ QUA {ten}: {loi.thong_diep}", file=sys.stderr)

    try:
        goi(f"/zones/{zone}/settings/security_header", token, "PATCH",
            {"value": HSTS})
        print("  strict_transport_security = 1 năm, gồm subdomain, preload")
    except LoiAPI as loi:
        print(f"  BỎ QUA HSTS: {loi.thong_diep}", file=sys.stderr)

    # Bot Fight Mode nằm ở endpoint riêng và gói Free có thể không cho token
    # chạm tới. Không dựng được thì ba lớp còn lại vẫn đứng, nên chỉ cảnh báo.
    try:
        goi(f"/zones/{zone}/bot_management", token, "PUT", {"fight_mode": True})
        print("  Bot Fight Mode = bật")
    except LoiAPI as loi:
        print(f"  BỎ QUA Bot Fight Mode: {loi.thong_diep}\n"
              "    Bật tay tại Cloudflare > Security > Bots.", file=sys.stderr)

    print("\nXong. Kiểm lại sau vài giây:")
    print("  python3 scripts/bao-ve-cloudflare.py --kiem-tra")
    print(f"  curl -si https://{mien}/wp-admin | head -1"
          "   # mong đợi HTTP 403 từ Cloudflare")
    return 0


if __name__ == "__main__":
    sys.exit(main())
