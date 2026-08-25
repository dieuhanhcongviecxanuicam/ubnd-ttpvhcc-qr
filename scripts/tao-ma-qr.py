#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sinh mã QR (PNG + SVG) cho trang chủ và từng lĩnh vực.

Địa chỉ nhúng trong mã QR phải khớp CHÍNH XÁC với route mà Next.js xuất ra
(chế độ static export + trailingSlash), cụ thể:

    QR tổng      ->  {BASE_URL}/
    QR lĩnh vực  ->  {BASE_URL}/linh-vuc/<slug>/

Cách dùng:
    python3 scripts/tao-ma-qr.py
    python3 scripts/tao-ma-qr.py --base-url https://ttpvhcc.xanuicam.vn

Nếu không truyền --base-url, script đọc biến môi trường:
    NEXT_PUBLIC_SITE_ORIGIN  (mặc định https://ttpvhcc.xanuicam.vn)
    NEXT_PUBLIC_BASE_PATH    (mặc định rỗng — tên miền riêng phục vụ từ gốc)
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import qrcode
from qrcode.image.svg import SvgPathImage

GOC_DU_AN = Path(__file__).resolve().parent.parent
THU_MUC_DU_LIEU = GOC_DU_AN / "data"
THU_MUC_QR = GOC_DU_AN / "public" / "qr"

MAU_QR = "#7A1E2B"   # đỏ son đậm — đồng bộ với --son-dam trong hệ thống thiết kế
MAU_NEN = "#FFFFFF"

ORIGIN_MAC_DINH = "https://ttpvhcc.xanuicam.vn"
BASE_PATH_MAC_DINH = ""


def lay_base_url(tham_so: str | None) -> str:
    """Xác định gốc URL sẽ nhúng vào mã QR, ưu tiên tham số dòng lệnh."""
    if tham_so:
        return tham_so.rstrip("/")
    origin = os.environ.get("NEXT_PUBLIC_SITE_ORIGIN", ORIGIN_MAC_DINH).rstrip("/")
    base_path = os.environ.get("NEXT_PUBLIC_BASE_PATH", BASE_PATH_MAC_DINH).rstrip("/")
    return f"{origin}{base_path}"


def sinh_ma_qr(noi_dung: str, ten_file_goc: Path) -> None:
    """Ghi ra hai định dạng: PNG (in ấn) và SVG (hiển thị web, nét ở mọi cỡ)."""
    tuy_chon = dict(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        # Vùng yên tĩnh 4 module là mức tối thiểu theo ISO/IEC 18004. Bản trước
        # để 2 module — vẫn quét được nhưng dễ lỗi khi in sát nội dung khác.
        border=4,
    )

    qr_png = qrcode.QRCode(box_size=12, **tuy_chon)
    qr_png.add_data(noi_dung)
    qr_png.make(fit=True)
    qr_png.make_image(fill_color=MAU_QR, back_color=MAU_NEN).save(
        f"{ten_file_goc}.png"
    )

    qr_svg = qrcode.QRCode(box_size=10, image_factory=SvgPathImage, **tuy_chon)
    qr_svg.add_data(noi_dung)
    qr_svg.make(fit=True)
    # Đồng bộ màu với bản PNG — mặc định SvgPathImage vẽ màu đen.
    anh_svg = qr_svg.make_image(fill_color=MAU_QR, back_color=MAU_NEN)
    anh_svg.save(f"{ten_file_goc}.svg")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base-url",
        help="Gốc URL triển khai, ví dụ https://ttpvhcc.xanuicam.vn",
    )
    args = parser.parse_args()

    base_url = lay_base_url(args.base_url)
    file_linh_vuc = THU_MUC_DU_LIEU / "linh-vuc.json"

    if not file_linh_vuc.exists():
        print(
            f"LỖI: không tìm thấy {file_linh_vuc}.\n"
            "Hãy chạy scripts/trich-xuat-du-lieu.py trước.",
            file=sys.stderr,
        )
        return 1

    THU_MUC_QR.mkdir(parents=True, exist_ok=True)

    # Xoá mã QR cũ để lĩnh vực đã bị gỡ khỏi danh mục không còn file mồ côi.
    for cu in THU_MUC_QR.glob("lv-*.*"):
        cu.unlink()

    print(f"Gốc URL nhúng vào mã QR: {base_url}")

    sinh_ma_qr(f"{base_url}/", THU_MUC_QR / "master")
    print(f"  QR tổng      -> {base_url}/")

    danh_sach = json.loads(file_linh_vuc.read_text(encoding="utf-8"))
    for lv in danh_sach:
        slug = lv["slug"]
        sinh_ma_qr(f"{base_url}/linh-vuc/{slug}/", THU_MUC_QR / f"lv-{slug}")

    print(f"  QR lĩnh vực  -> {len(danh_sach)} mã")
    print(f"Đã ghi {2 * (len(danh_sach) + 1)} file vào {THU_MUC_QR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
