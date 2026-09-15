#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phần dùng chung khi gọi API Cloudflare: đọc token, gọi API, tra zone.

Tách ra khỏi scripts/cau-hinh-cloudflare.py khi thêm scripts/bao-ve-cloudflare.py.
Lý do tách chứ không chép: phần tra zone đã từng sai một lần và gây hỏng thật -
job xoá cache tra theo tên miền đầy đủ `ttpvhcc.xanuicam.vn` trong khi zone của
Cloudflare là tên miền gốc `xanuicam.vn`, nên trượt ngay lượt triển khai đầu
tiên. Chép đoạn đó sang script thứ hai là chép luôn cơ hội sai lại y hệt.

Chỉ dùng thư viện chuẩn, để chạy được ngay trên runner mà không cần cài gì.
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

# Dấu nhận biết luật do kho mã này quản lý, để chạy lại không tạo trùng và không
# đụng vào luật do người khác đặt tay trên dashboard.
DAU = "[ubnd-ttpvhcc-qr]"


class LoiAPI(Exception):
    """Cloudflare trả lỗi. Giữ nguyên mã và thông điệp gốc để người đọc log hiểu ngay."""

    def __init__(self, ma: int, thong_diep: str):
        super().__init__(f"HTTP {ma}: {thong_diep}")
        self.ma = ma
        self.thong_diep = thong_diep


def ten_mien() -> str:
    """Đọc tên miền từ public/CNAME - nguồn sự thật đã có sẵn trong kho."""
    return (GOC_DU_AN / "public" / "CNAME").read_text(encoding="utf-8").strip()


def doc_token(quyen_can: str) -> str:
    """Lấy token từ môi trường, kèm hướng dẫn quyền tối thiểu khi thiếu."""
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    if not token:
        print(
            "Thiếu CLOUDFLARE_API_TOKEN.\n"
            "Tạo tại Cloudflare > My Profile > API Tokens, phạm vi chọn đúng zone\n"
            f"xanuicam.vn (KHÔNG chọn All zones), quyền:\n{quyen_can}\n"
            "rồi: export CLOUDFLARE_API_TOKEN=...",
            file=sys.stderr,
        )
        raise SystemExit(1)
    return token


def goi(duong_dan: str, token: str, method: str = "GET", than=None,
        cho_phep_404: bool = False) -> dict:
    """Gọi API. Ném LoiAPI để nơi gọi tự quyết định dừng hay đi tiếp."""
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
        chi_tiet = "; ".join(
            x.get("message", "") for x in (kq.get("errors") or [])
        ) or loi.reason
        raise LoiAPI(loi.code, chi_tiet) from None


def goi_hoac_dung(duong_dan: str, token: str, method: str = "GET", than=None,
                  cho_phep_404: bool = False, goi_y_quyen: str = "") -> dict:
    """Như goi() nhưng in lỗi rồi thoát - dùng cho thao tác không đi tiếp được."""
    try:
        return goi(duong_dan, token, method, than, cho_phep_404)
    except LoiAPI as loi:
        print(f"LỖI API {loi.ma} khi {method} {duong_dan}: {loi.thong_diep}",
              file=sys.stderr)
        if loi.ma in (401, 403) and goi_y_quyen:
            print(f"  Token thiếu quyền hoặc sai. Cần:\n{goi_y_quyen}", file=sys.stderr)
        raise SystemExit(1) from None


def tra_zone(token: str, mien: str) -> tuple[str, str]:
    """Trả (zone id, tên zone).

    Zone của Cloudflare là tên miền GỐC (`xanuicam.vn`), không phải subdomain mà
    site chạy trên đó (`ttpvhcc.xanuicam.vn`). Nên phải duyệt danh sách zone rồi
    chọn zone là hậu tố dài nhất của tên miền, chứ không tra thẳng theo tên.
    """
    kq = goi_hoac_dung("/zones?per_page=50", token,
                       goi_y_quyen="    Zone / Zone / Read")
    ung_vien = [z for z in (kq.get("result") or [])
                if mien == z["name"] or mien.endswith("." + z["name"])]
    if not ung_vien:
        thay = ", ".join(z["name"] for z in (kq.get("result") or [])) or "(không có)"
        print(f"Không tìm thấy zone chứa {mien}. Token thấy các zone: {thay}",
              file=sys.stderr)
        raise SystemExit(1)
    z = max(ung_vien, key=lambda x: len(x["name"]))
    return z["id"], z["name"]
