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

   Từng có luật thứ ba "điểm đe doạ cao thì bắt xác minh" dựa trên
   cf.threat_score. Đã gỡ trước khi áp dụng lần nào: Cloudflare ngừng trường này
   từ 30/09/2024 và nó LUÔN trả 0, nên luật đó không bao giờ khớp - một luật
   chết nằm trong tường lửa chỉ tạo cảm giác an toàn giả. Trường thay thế
   (cf.waf.score) chỉ có từ gói Business. Trên gói Free, phần đánh giá danh
   tiếng IP do Security Level và Bot Fight Mode đảm nhận.
2. Luật giới hạn tần suất (phase http_ratelimit): một IP dội quá ngưỡng thì phải
   qua trang xác minh; qua được thì bộ đếm về 0.
3. Bot Fight Mode: Cloudflare tự nhận diện bot giả mạo trình duyệt.
4. Cài đặt zone: HSTS, TLS tối thiểu 1.2, luôn dùng HTTPS, Browser Integrity
   Check.

CÒN "TRANG XÁC MINH BẢO MẬT" NHƯ grok.com THÌ SAO
-------------------------------------------------
Đó là trang MỌI người truy cập đều phải qua vài giây trước khi xem được nội
dung. Script có sẵn công tắc (--che-do-tan-cong bat),
nhưng CỐ Ý KHÔNG bật thường trực, vì đây là trang dịch vụ công:

  - Người dân quét mã QR tại quầy phải chờ thêm vài giây mỗi lần mở trang, và
    trên máy cũ hoặc trình duyệt hiếm, bước xác minh có thể thất bại hẳn - khi
    đó họ mất luôn đường tra cứu thủ tục.
  - Trình đọc màn hình và người dùng bàn phím gặp thêm một rào cản không cần
    thiết, trong khi dự án cam kết WCAG 2.1 AA.
  - Bot tìm kiếm bị chặn, trang rụng khỏi kết quả tìm kiếm.
  - Nội dung ở đây là thông tin công khai bắt buộc phải niêm yết. Bắt người dân
    chứng minh mình không phải máy để đọc thông tin công khai là đặt sai ưu tiên.

Nên: ngày thường chạy các lớp ở trên - vốn đã chặn được lưu lượng lạm dụng mà
người dân không thấy gì; khi thật sự bị tấn công thì bật công tắc bằng một lệnh
(hoặc bằng workflow "Chế độ chống tấn công" trên GitHub), và TẮT ngay khi hết đợt.

Công tắc KHÔNG dùng Under Attack Mode của Cloudflare dù hiệu ứng giống hệt. Under
Attack Mode là cài đặt TOÀN ZONE: bật nó là dựng trang xác minh trước mặt mọi
subdomain của xanuicam.vn, kể cả hệ thống khác không hề bị tấn công. Thay vào đó
công tắc là một luật WAF managed_challenge chỉ khớp http.host của site này. Nó
còn hơn Under Attack Mode ở một điểm: luật bỏ qua bot tìm kiếm đã xác minh đứng
trước nó, nên đang chống tấn công vẫn không rụng khỏi kết quả tìm kiếm - và kẻ
tấn công không giả được trạng thái "bot đã xác minh", vì Cloudflare xác minh
bằng IP và DNS ngược chứ không bằng User-Agent.

ZONE DÙNG CHUNG - KHÔNG BAO GIỜ GHI LẠI LUẬT CỦA HỆ THỐNG KHÁC
-------------------------------------------------------------
Zone xanuicam.vn phục vụ nhiều subdomain. Lúc áp dụng lần đầu (15/09/2026) đã có
sẵn luật của một ứng dụng khác, quản lý bởi script cloudflare-waf-apply.sh: một
luật WAF cho /api/auth/login và luật chống brute-force đăng nhập.

Bản đầu của script này ghi bằng cách PUT lại TOÀN BỘ bộ luật của phase. Cách đó
tạo lại luật của hệ thống kia với ID mới, đủ để làm hỏng script đang quản lý
chúng theo ID. Đã phát hiện nhờ đọc trạng thái trước khi ghi, và sửa trước khi
ghi lần nào: nay script chỉ POST / PATCH / DELETE từng luật mang `ref` bắt đầu
bằng REF_TIEN_TO. Luật không mang tiền tố đó không bị đọc lại, ghi lại hay đổi
thứ tự.

Luật tần suất cũng tự NHƯỜNG: gói Free chỉ có một chỗ cho loại luật này, và chỗ
đó đang giữ luật chống brute-force đăng nhập của hệ thống kia - thứ quan trọng
hơn nhiều so với giới hạn tần suất cho một trang tĩnh. Gộp hai luật làm một cũng
không được: một luật chỉ có một ngưỡng, ngưỡng 5 request/10s của trang đăng nhập
áp lên trang tra cứu thì chặn luôn người dân mở trang bình thường.

MẶC ĐỊNH CHỈ ĐỌC VÀ IN RA DỰ ĐỊNH, KHÔNG GHI GÌ. Muốn ghi thật phải thêm --ap-dung.

Cần biến môi trường CLOUDFLARE_API_TOKEN với quyền:
    Zone / Zone / Read              (tra zone - luôn cần)
    Zone / Zone Settings / Read     (cho --kiem-tra)
    Zone / Zone Settings / Edit     (cho --ap-dung, chỉ khi cài đặt zone lệch)
    Zone / Zone WAF / Edit          (cho --ap-dung và --che-do-tan-cong)
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
# THOI_GIAN_CHAN = 0 là bắt buộc chứ không phải lựa chọn: trên gói Free, Pro và
# Business, luật dùng hành động xác minh phải đặt mitigation_timeout = 0 - tức
# "giãn tốc": qua được trang xác minh thì bộ đếm của IP đó về 0, dội tiếp thì
# gặp xác minh lần nữa. Không có danh sách chặn nào để quên xoá.
# ---------------------------------------------------------------------------
NGUONG_REQUEST = 60
KHOANG_DEM = 10
THOI_GIAN_CHAN = 0

# Khoá ổn định đánh dấu luật do kho mã này quản lý. So khớp bằng `ref` chứ không
# bằng mô tả: mô tả chứa ngưỡng, đổi ngưỡng là đổi mô tả, và so theo mô tả sẽ
# biến một lần sửa ngưỡng thành "xoá luật cũ, tạo luật mới".
REF_TIEN_TO = "ubnd-ttpvhcc-qr-"

# Số luật giới hạn tần suất tối đa theo gói (tài liệu Cloudflare, 09/2026).
SO_LUAT_TAN_SUAT_TOI_DA = {"free": 1, "pro": 2, "business": 5}

# Đuôi và thư mục mà một site tĩnh không bao giờ có. Danh sách cố ý ngắn: chỉ
# gồm thứ chắc chắn không tồn tại, để không có cách nào chặn nhầm người dân.
DUONG_DAN_LA = [
    "/wp-admin", "/wp-login", "/wp-content", "/wp-includes", "/xmlrpc.php",
    "/.env", "/.git", "/.aws", "/.ssh", "/vendor/", "/cgi-bin/",
    "/phpmyadmin", "/administrator", "/.well-known/acme-challenge/../",
]
DUOI_LA = [".php", ".asp", ".aspx", ".jsp", ".cgi", ".sql", ".bak", ".old", ".env"]

# ---------------------------------------------------------------------------
# Danh sách áp cho TOÀN ZONE, không riêng ttpvhcc.xanuicam.vn
#
# Zone xanuicam.vn còn phục vụ hệ thống của đơn vị khác. Danh sách DUONG_DAN_LA
# ở trên KHÔNG được đem ra toàn zone: nó chặn /wp-admin, /phpmyadmin, /vendor/
# và đuôi .php - toàn thứ hợp lệ trên một site WordPress hay PHP. Áp ra toàn
# zone là khoá cửa quản trị của đồng nghiệp, và họ sẽ không biết vì sao.
#
# Danh sách dưới đây hẹp hơn hẳn, chỉ gồm những đường dẫn KHÔNG một máy chủ web
# nào nên phục vụ, bất kể chạy nền tảng gì: tệp bí mật và siêu dữ liệu hệ thống
# quản lý mã nguồn. Chặn nhầm người dùng thật là điều không thể xảy ra, vì không
# có người dùng thật nào mở /.git/config.
#
# Lý do có mặt: AI Crawl Control ghi nhận /dev/.env trên thongtin.xanuicam.vn là
# đường dẫn bị bot dò nhiều nhất zone. Lần đó máy chủ trả 404 nên không mất gì,
# nhưng nó cho thấy bot đang rà zone này, và một hệ thống anh em cấu hình lỏng
# hơn một chút là đủ để mất khoá cơ sở dữ liệu.
#
# KHÔNG thêm /.well-known/ vào đây: đó là đường dẫn hợp lệ, security.txt và
# chứng thư ACME đều nằm trong đó.
# ---------------------------------------------------------------------------
DUONG_DAN_BI_MAT = [
    "/.env", "/.git", "/.svn", "/.hg", "/.aws", "/.ssh",
    "/.htpasswd", "/.htaccess", "/.ds_store", "/.npmrc", "/.dockerenv",
]
# Cố ý KHÔNG có ".key": đuôi này vừa là khoá riêng vừa là tệp trình chiếu
# Keynote của Apple. Một cơ quan đăng bài trình chiếu .key lên trang là chuyện
# có thể xảy ra, và khi đó tệp biến mất không lời giải thích. Bốn đuôi còn lại
# không mang nghĩa nào khác ngoài khoá và chứng thư.
DUOI_BI_MAT = [".env", ".pem", ".p12", ".keystore"]

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


def bieu_thuc_bi_mat() -> str:
    """Biểu thức khớp tệp bí mật, KHÔNG giới hạn theo host - áp cho cả zone."""
    duong = " or ".join(
        f'starts_with(lower(http.request.uri.path), "{d}")' for d in DUONG_DAN_BI_MAT
    )
    duoi = " or ".join(
        f'ends_with(lower(http.request.uri.path), "{d}")' for d in DUOI_BI_MAT
    )
    return f"({duong} or {duoi})"


# Giới hạn độ dài biểu thức của một luật WAF (tài liệu Cloudflare, 09/2026).
# Gộp nhiều phạm vi vào một luật để tiết kiệm suất thì phải canh trần này, nếu
# không lần thêm đường dẫn tiếp theo sẽ hỏng lúc gọi API chứ không phải lúc đọc
# mã, và thông điệp lỗi của Cloudflare không nói rõ nguyên nhân.
DAI_BIEU_THUC_TOI_DA = 4096


def luat_waf(mien: str) -> list[dict]:
    thuoc_mien = f'http.host eq "{mien}"'
    return [
        {
            "ref": f"{REF_TIEN_TO}bo-qua-bot-tim-kiem",
            "description": f"{DAU} bot tìm kiếm đã xác minh - bỏ qua các luật sau",
            "expression": f"({thuoc_mien} and cf.client.bot)",
            "action": "skip",
            # Bỏ qua phần còn lại của chính bộ luật này, không bỏ qua lớp khác.
            "action_parameters": {"ruleset": "current"},
            "enabled": True,
        },
        {
            # Gộp hai phạm vi vào MỘT luật thay vì tách thành hai. Gói Free chỉ
            # cho 5 luật WAF tuỳ chỉnh trên toàn zone, và zone này dùng chung -
            # mỗi suất tiêu thêm là một suất hệ thống khác không còn để dùng.
            # Biểu thức dài không tốn gì, luật thứ ba thì có.
            "ref": f"{REF_TIEN_TO}chan-duong-dan-quet",
            "description": f"{DAU} chặn đường dẫn quét lỗ hổng (site) và tệp bí mật (toàn zone)",
            "expression": (
                f"(({thuoc_mien} and {bieu_thuc_duong_dan_la()})"
                f" or {bieu_thuc_bi_mat()})"
            ),
            "action": "block",
            "enabled": True,
        },
    ]


# ---------------------------------------------------------------------------
# Chặn Cloudflare chèn script JavaScript Detections vào HTML
#
# Bối cảnh: CSP của site băm từng script nội tuyến và không có 'unsafe-inline'.
# Cloudflare chèn một script mang mã định danh riêng cho từng lượt tải
# (window.__CF$cv$params) nên không băm trước được, và trình duyệt chặn nó - mỗi
# lượt xem trang ghi một lỗi trong console. Đã tắt Bot Fight Mode mà script vẫn
# còn; tài liệu Cloudflare nói JavaScript Detections không tắt riêng được trên
# gói Free.
#
# Lối thoát nằm trong chính tài liệu đó: Cloudflare KHÔNG chèn script nếu phản
# hồi mang chỉ thị `Cache-Control: no-transform`. GitHub Pages đặt cứng
# `max-age=600` và không có cơ chế header tuỳ chỉnh nào (tệp _headers là tính
# năng của Cloudflare Pages và Netlify, GitHub Pages không đọc nó), nên phải đặt
# header ở biên bằng một luật biến đổi.
#
# CHƯA CHẮC ĂN, và đừng ghi vào tài liệu như thể chắc: tài liệu viết "if the
# origin response includes", mà luật này chạy SAU khi phản hồi rời origin. Có
# thể Cloudflare vẫn thấy header và bỏ qua việc chèn, có thể không. Cách duy
# nhất để biết là đo sau khi áp - xem npm run kiem-tra-san-xuat, nó đếm số mẫu
# còn dính script.
#
# Giữ nguyên max-age=600 của GitHub Pages thay vì đặt giá trị mới: chiến lược
# cache đã cân nhắc riêng (xem docs/HIEU-NANG.md), luật này chỉ thêm no-transform
# chứ không nhân tiện đổi thứ khác.
#
# Phạm vi chỉ ttpvhcc.xanuicam.vn. Zone dùng chung; hệ thống khác có thể đang
# dựa vào một tính năng biến đổi nội dung nào đó của Cloudflare.
# ---------------------------------------------------------------------------
CACHE_CONTROL_GOC = "max-age=600"


def luat_bien_doi_header(mien: str) -> list[dict]:
    return [
        {
            "ref": f"{REF_TIEN_TO}chan-chen-script",
            "description": f"{DAU} no-transform - chặn Cloudflare chèn script vào HTML",
            "expression": f'(http.host eq "{mien}")',
            "action": "rewrite",
            "action_parameters": {
                "headers": {
                    "Cache-Control": {
                        "operation": "set",
                        "value": f"{CACHE_CONTROL_GOC}, no-transform",
                    }
                }
            },
            "enabled": True,
        },
    ]


def kiem_do_dai_bieu_thuc(luat: list[dict]) -> None:
    """Dừng sớm nếu biểu thức vượt trần, kèm chỉ dẫn cách xử lý."""
    for r in luat:
        dai = len(r["expression"])
        if dai > DAI_BIEU_THUC_TOI_DA:
            print(
                f"Biểu thức của luật {r['ref']} dài {dai} ký tự, vượt trần "
                f"{DAI_BIEU_THUC_TOI_DA}.\n"
                "  Rút bớt DUONG_DAN_LA / DUONG_DAN_BI_MAT, hoặc tách thành luật "
                "riêng nếu\n  zone còn suất trống (gói Free cho 5 luật WAF tuỳ chỉnh).",
                file=sys.stderr,
            )
            raise SystemExit(1)


REF_CONG_TAC = f"{REF_TIEN_TO}che-do-tan-cong"


def luat_cong_tac(mien: str, bat: bool) -> dict:
    """Luật "chế độ chống tấn công": bắt MỌI người vào site này qua xác minh.

    Nằm CUỐI bộ luật WAF: luật bỏ qua bot tìm kiếm đứng trước nên bot đã xác
    minh vẫn đi qua; luật chặn đường dẫn quét đứng trước nên máy quét vẫn bị
    chặn thẳng thay vì chỉ bị xác minh. Tắt thì giữ luật ở trạng thái
    enabled=false để bật lại lần sau chỉ là một lệnh PATCH.
    """
    return {
        "ref": REF_CONG_TAC,
        "description": f"{DAU} CHẾ ĐỘ CHỐNG TẤN CÔNG - xác minh mọi người truy cập"
                       " (chỉ bật khi đang bị tấn công)",
        "expression": f'(http.host eq "{mien}")',
        "action": "managed_challenge",
        "enabled": bat,
    }


def luat_tan_suat(mien: str) -> list[dict]:
    return [
        {
            "ref": f"{REF_TIEN_TO}gioi-han-tan-suat",
            "description": f"{DAU} một IP dội quá {NGUONG_REQUEST} request/"
                           f"{KHOANG_DEM}s - bắt xác minh",
            "expression": f'(http.host eq "{mien}")',
            "action": "managed_challenge",
            "ratelimit": {
                # Đếm theo IP và theo từng điểm biên. Cloudflare bắt buộc kèm
                # cf.colo.id vì mỗi điểm biên đếm độc lập.
                "characteristics": ["ip.src", "cf.colo.id"],
                "period": KHOANG_DEM,
                "requests_per_period": NGUONG_REQUEST,
                "mitigation_timeout": THOI_GIAN_CHAN,
            },
            "enabled": True,
        }
    ]


def cua_ta(r: dict) -> bool:
    return (r.get("ref") or "").startswith(REF_TIEN_TO)


def doc_luat(zone: str, token: str, phase: str) -> list[dict]:
    duong = f"/zones/{zone}/rulesets/phases/{phase}/entrypoint"
    kq = goi_hoac_dung(duong, token, cho_phep_404=True, goi_y_quyen=QUYEN)
    return (kq.get("result") or {}).get("rules") or []


def dong_bo_luat(zone: str, token: str, phase: str, moi: list[dict],
                 ten_phase: str) -> bool:
    """Đưa luật của kho mã về đúng `moi`, KHÔNG chạm vào luật nào khác.

    Tạo, sửa, xoá từng luật qua endpoint theo luật. Luật không mang REF_TIEN_TO
    giữ nguyên ID, nội dung và vị trí. Trả False nếu có luật không ghi được.
    """
    duong_entry = f"/zones/{zone}/rulesets/phases/{phase}/entrypoint"
    kq = goi_hoac_dung(duong_entry, token, cho_phep_404=True, goi_y_quyen=QUYEN)
    bo_luat = kq.get("result") or {}

    if not bo_luat.get("id"):
        # Phase chưa có bộ luật nào: tạo mới chỉ với luật của ta. Không tồn tại
        # luật của ai khác để làm hỏng, nên PUT ở đây là an toàn.
        try:
            goi(duong_entry, token, "PUT", {"rules": moi})
        except LoiAPI as loi:
            print(f"  LỖI khi tạo {ten_phase}: {loi.thong_diep}", file=sys.stderr)
            return False
        print(f"  {ten_phase}: tạo mới {len(moi)} luật.")
        return True

    goc = f"/zones/{zone}/rulesets/{bo_luat['id']}/rules"
    hien_co = {r["ref"]: r for r in (bo_luat.get("rules") or []) if cua_ta(r)}
    so_khac = sum(1 for r in (bo_luat.get("rules") or []) if not cua_ta(r))
    on = True

    for luat in moi:
        cu = hien_co.get(luat["ref"])
        try:
            if cu:
                goi(f"{goc}/{cu['id']}", token, "PATCH", luat)
                print(f"  {ten_phase}: cập nhật  {luat['ref']}")
            else:
                goi(goc, token, "POST", luat)   # thêm vào CUỐI, không đẩy luật khác
                print(f"  {ten_phase}: thêm mới  {luat['ref']}")
        except LoiAPI as loi:
            print(f"  LỖI {ten_phase} / {luat['ref']}: {loi.thong_diep}", file=sys.stderr)
            on = False

    mong_muon = {luat["ref"] for luat in moi}
    for ref, cu in hien_co.items():
        # Luật công tắc có vòng đời riêng (--che-do-tan-cong). Chạy --ap-dung
        # giữa đợt tấn công mà gỡ mất nó là tự tắt lá chắn đúng lúc cần nhất.
        if ref in mong_muon or ref == REF_CONG_TAC:
            continue
        try:
            goi(f"{goc}/{cu['id']}", token, "DELETE")
            print(f"  {ten_phase}: gỡ luật cũ {ref}")
        except LoiAPI as loi:
            print(f"  LỖI khi gỡ {ref}: {loi.thong_diep}", file=sys.stderr)
            on = False

    if so_khac:
        print(f"  {ten_phase}: giữ nguyên {so_khac} luật của hệ thống khác.")
    return on


def goi_zone(zone: str, token: str) -> str:
    """Tên gói của zone, dạng 'free' / 'pro' / 'business' / 'enterprise'."""
    try:
        kq = goi(f"/zones/{zone}", token)
        return ((kq.get("result") or {}).get("plan") or {}).get("legacy_id") or "?"
    except LoiAPI:
        return "?"


def cho_trong_tan_suat(zone: str, token: str) -> tuple[bool, str]:
    """Còn chỗ cho luật tần suất của ta không, và lý do nếu không.

    Luật của ta đã có sẵn thì luôn còn chỗ (chỉ là cập nhật). Chưa có thì chỉ
    thêm khi số luật của hệ thống khác còn dưới giới hạn gói - tuyệt đối không
    gỡ luật của ai để lấy chỗ.
    """
    goi_dv = goi_zone(zone, token)
    toi_da = SO_LUAT_TAN_SUAT_TOI_DA.get(goi_dv)
    luat = doc_luat(zone, token, "http_ratelimit")
    if any(cua_ta(r) for r in luat) or toi_da is None:
        return True, ""
    khac = [r for r in luat if not cua_ta(r)]
    if len(khac) < toi_da:
        return True, ""
    ten = "; ".join((r.get("description") or "(không mô tả)")[:70] for r in khac)
    return False, (f"gói {goi_dv} chỉ cho {toi_da} luật tần suất và chỗ đã được dùng: "
                   f"{ten}")


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
                        ("http_response_headers_transform", "luật biến đổi header"),
                        ("http_ratelimit", "luật giới hạn tần suất")):
        try:
            luat = doc_luat(zone, token, phase)
        except SystemExit:
            print(f"  {nhan:26s} (không đọc được)")
            continue
        so_cua_ta = sum(1 for r in luat if cua_ta(r))
        print(f"  {nhan:26s} {len(luat)} luật ({so_cua_ta} của kho mã)")
        for r in luat:
            dau_hieu = "*" if cua_ta(r) else " "
            trang_thai = "" if r.get("enabled", True) else "  [đang tắt]"
            print(f"     {dau_hieu} {r.get('action'):18s}"
                  f" {(r.get('description') or '(không mô tả)')[:70]}{trang_thai}")


def dat_che_do_tan_cong(zone: str, token: str, mien: str, bat: bool) -> int:
    duong_entry = f"/zones/{zone}/rulesets/phases/http_request_firewall_custom/entrypoint"
    bo_luat = (goi_hoac_dung(duong_entry, token, cho_phep_404=True,
                             goi_y_quyen=QUYEN).get("result") or {})
    luat = luat_cong_tac(mien, bat)

    if not bo_luat.get("id"):
        if not bat:
            print("Chưa có luật chống tấn công nào - không có gì để tắt.")
            return 0
        goi_hoac_dung(duong_entry, token, "PUT", {"rules": [luat]}, goi_y_quyen=QUYEN)
    else:
        goc = f"/zones/{zone}/rulesets/{bo_luat['id']}/rules"
        cu = next((r for r in bo_luat.get("rules") or [] if r.get("ref") == REF_CONG_TAC),
                  None)
        if cu:
            goi_hoac_dung(f"{goc}/{cu['id']}", token, "PATCH", luat, goi_y_quyen=QUYEN)
        elif bat:
            goi_hoac_dung(goc, token, "POST", luat, goi_y_quyen=QUYEN)
        else:
            print("Chưa có luật chống tấn công nào - không có gì để tắt.")
            return 0

    if bat:
        print(f"ĐÃ BẬT chế độ chống tấn công cho {mien}.\n"
              "  Mọi người truy cập site này nay phải qua trang xác minh. Bot tìm kiếm\n"
              "  đã xác minh vẫn đi qua; các subdomain khác của zone không bị ảnh hưởng.\n"
              "  TẮT ngay khi hết đợt tấn công:\n"
              "      python3 scripts/bao-ve-cloudflare.py --che-do-tan-cong tat")
    else:
        print(f"Đã tắt chế độ chống tấn công cho {mien}. Các lớp thường trực vẫn chạy.")
    # Đo thật ngày 15/09/2026: sau lệnh tắt, hai lượt tải đầu vẫn gặp trang xác
    # minh, từ giây thứ 15-20 mới trả 200 ổn định. Không báo trước điều này thì
    # người trực dễ tưởng lệnh không ăn rồi bật/tắt lung tung.
    print("  Cloudflare cần khoảng 20-30 giây để cập nhật ở mọi điểm biên -"
          " chưa thấy tác dụng ngay là bình thường.")
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
        return dat_che_do_tan_cong(zone, token, mien, che_do)

    if chi_kiem_tra:
        in_trang_thai(zone, token, mien)
        return 0

    waf = luat_waf(mien)
    kiem_do_dai_bieu_thuc(waf)
    tan_suat = luat_tan_suat(mien)
    bien_doi = luat_bien_doi_header(mien)

    print(f"\nSẽ đặt {len(waf)} luật WAF:")
    for r in waf:
        print(f"  - [{r['action']}] {r['description']}")
        print(f"      khi: {r['expression'][:150]}")
    print(f"\nSẽ đặt {len(bien_doi)} luật biến đổi header phản hồi:")
    for r in bien_doi:
        dat = r["action_parameters"]["headers"]
        for ten, gt in dat.items():
            print(f"  - {ten}: {gt['value']}")
        print(f"      khi: {r['expression']}")

    print(f"\nSẽ đặt {len(tan_suat)} luật giới hạn tần suất:")
    for r in tan_suat:
        rl = r["ratelimit"]
        print(f"  - [{r['action']}] {r['description']}")
        cach = ("giãn tốc - qua xác minh thì đếm lại" if not rl["mitigation_timeout"]
                else f"giữ {rl['mitigation_timeout']}s")
        print(f"      đếm theo {', '.join(rl['characteristics'])};"
              f" {rl['requests_per_period']} request/{rl['period']}s; {cach}")
    print("\nSẽ đặt cài đặt zone:")
    for k, v in CAI_DAT_ZONE.items():
        print(f"  - {k} = {v}")
    print("  - strict_transport_security = 1 năm, gồm subdomain, preload")
    print("  - Bot Fight Mode = bật")

    in_trang_thai(zone, token, mien)

    con_cho, ly_do = cho_trong_tan_suat(zone, token)
    if not con_cho:
        print(f"\nLuật tần suất sẽ NHƯỜNG: {ly_do}.")

    if not ap_dung:
        print("\nĐây mới là xem trước. Thêm --ap-dung để ghi thật.")
        return 0

    print("\nĐang ghi:")
    on = dong_bo_luat(zone, token, "http_request_firewall_custom", waf, "WAF")
    on = dong_bo_luat(zone, token, "http_response_headers_transform",
                      bien_doi, "biến đổi header") and on

    if con_cho:
        on = dong_bo_luat(zone, token, "http_ratelimit", tan_suat, "tần suất") and on
    else:
        print(f"  tần suất: NHƯỜNG, không thêm luật - {ly_do}.\n"
              "    Không gỡ luật đó để lấy chỗ. Xem phần đầu file để biết vì sao.")

    # Cài đặt zone áp cho MỌI subdomain, kể cả hệ thống khác cùng zone. Nên chỉ
    # ghi khi giá trị thật sự khác: chạy lại script không được sinh ra một loạt
    # thay đổi toàn zone trong nhật ký kiểm toán của người quản lý hệ thống kia.
    for ten, gt in {**CAI_DAT_ZONE, "security_header": HSTS}.items():
        try:
            hien_tai = (goi(f"/zones/{zone}/settings/{ten}", token)
                        .get("result") or {}).get("value")
            if hien_tai == gt:
                print(f"  {ten}: đã đúng, không ghi")
                continue
            goi(f"/zones/{zone}/settings/{ten}", token, "PATCH", {"value": gt})
            print(f"  {ten}: đã đổi")
        except LoiAPI as loi:
            print(f"  BỎ QUA {ten}: {loi.thong_diep}", file=sys.stderr)

    # Bot Fight Mode nằm ở endpoint riêng và gói Free có thể không cho token
    # chạm tới. Không dựng được thì ba lớp còn lại vẫn đứng, nên chỉ cảnh báo.
    try:
        goi(f"/zones/{zone}/bot_management", token, "PUT", {"fight_mode": True})
        print("  Bot Fight Mode = bật")
    except LoiAPI as loi:
        print(f"  BỎ QUA Bot Fight Mode: {loi.thong_diep}\n"
              "    Bật tay tại Cloudflare > Security > Bots.", file=sys.stderr)

    if not on:
        print("\nCÓ LUẬT KHÔNG GHI ĐƯỢC - xem các dòng LỖI ở trên.", file=sys.stderr)
        return 1

    print("\nXong. Kiểm lại sau vài giây:")
    print("  python3 scripts/bao-ve-cloudflare.py --kiem-tra")
    print(f"  curl -si https://{mien}/wp-admin | head -1"
          "   # mong đợi HTTP 403 từ Cloudflare")
    return 0


if __name__ == "__main__":
    sys.exit(main())
