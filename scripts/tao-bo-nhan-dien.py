#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sinh toàn bộ bộ nhận diện (logo, favicon, icon PWA) từ MỘT file logo gốc.

Việc tách nền dùng thuật toán loang từ viền ảnh (flood fill) thay vì đổi mọi
pixel trắng thành trong suốt. Khác biệt quan trọng: các đường vân tay màu trắng
nằm *bên trong* hình bàn tay được giữ nguyên là nét vẽ, chỉ phần nền nối liền ra
mép ảnh (kể cả khoảng âm hình ngôi sao ở giữa) mới bị xoá.

Cách dùng:
    python3 scripts/tao-bo-nhan-dien.py
    python3 scripts/tao-bo-nhan-dien.py brand/logo-khac.png
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

GOC_DU_AN = Path(__file__).resolve().parent.parent
LOGO_GOC = GOC_DU_AN / "brand" / "logo-ttpvhcc.png"
THU_MUC_RA = GOC_DU_AN / "public" / "brand"
FAVICON_ICO = GOC_DU_AN / "public" / "favicon.ico"

# Ngưỡng nhận diện nền: pixel có kênh màu thấp nhất >= 255 - NGUONG_NEN coi là "gần trắng"
NGUONG_NEN = 40
# Dải chuyển tiếp để mép logo mượt, không răng cưa
MEM_TU, MEM_DEN = 4, 40

# Kích thước cần sinh: (tên file, cạnh)
KICH_THUOC = [
    ("logo.png", 128),              # logo trên thanh điều hướng
    ("logo-512.png", 512),          # ảnh chia sẻ mạng xã hội
    ("favicon-16x16.png", 16),
    ("favicon-32x32.png", 32),
    ("apple-touch-icon.png", 180),  # màn hình chính iOS
    ("icon-192.png", 192),          # PWA / Android
    ("icon-512.png", 512),
]


def tach_nen(anh: Image.Image) -> Image.Image:
    """Xoá nền nối liền ra mép ảnh, giữ nguyên chi tiết trắng bên trong hình."""
    rgba = np.array(anh.convert("RGBA"), dtype=np.int16)
    # Khoảng cách tới màu trắng: 0 là trắng tinh, càng lớn càng đậm màu
    cach_trang = 255 - rgba[:, :, :3].min(axis=2)

    gan_trang = cach_trang <= NGUONG_NEN
    nhan, _ = ndimage.label(gan_trang)

    # Chỉ những vùng gần trắng chạm được vào mép ảnh mới là nền thật
    vien = np.concatenate([nhan[0, :], nhan[-1, :], nhan[:, 0], nhan[:, -1]])
    nhan_nen = set(int(v) for v in np.unique(vien) if v != 0)
    la_nen = np.isin(nhan, list(nhan_nen)) if nhan_nen else np.zeros_like(gan_trang)

    alpha = np.full(cach_trang.shape, 255, dtype=np.float32)
    mem = (cach_trang - MEM_TU) / (MEM_DEN - MEM_TU) * 255
    alpha[la_nen] = np.clip(mem[la_nen], 0, 255)

    rgba[:, :, 3] = alpha.astype(np.int16)
    ket_qua = Image.fromarray(rgba.astype(np.uint8), "RGBA")

    # Cắt bỏ viền trong suốt thừa để logo lấp đầy khung khi hiển thị
    hop = ket_qua.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    return ket_qua.crop(hop) if hop else ket_qua


def vuong_hoa(anh: Image.Image) -> Image.Image:
    """Đặt logo vào khung vuông trong suốt để mọi kích thước xuất ra không méo."""
    canh = max(anh.size)
    khung = Image.new("RGBA", (canh, canh), (0, 0, 0, 0))
    khung.paste(anh, ((canh - anh.width) // 2, (canh - anh.height) // 2))
    return khung


def toi_uu(anh: Image.Image) -> Image.Image:
    """Giảm dung lượng bằng bảng màu - logo phẳng ít màu nên không mất chất lượng."""
    return anh.quantize(colors=128, method=Image.Quantize.FASTOCTREE).convert("RGBA")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("nguon", nargs="?", help="File logo gốc (mặc định brand/logo-ttpvhcc.png)")
    args = parser.parse_args()

    src = Path(args.nguon) if args.nguon else LOGO_GOC
    if not src.is_absolute():
        src = GOC_DU_AN / src
    if not src.exists():
        print(f"LỖI: không tìm thấy {src}", file=sys.stderr)
        return 1

    print(f"Logo gốc: {src.relative_to(GOC_DU_AN)}")
    goc = Image.open(src)
    print(f"  {goc.size[0]}x{goc.size[1]} {goc.mode}")

    sach = vuong_hoa(tach_nen(goc))
    trong_suot = (np.array(sach.getchannel("A")) < 16).mean() * 100
    print(f"  Sau khi tách nền: {sach.size[0]}x{sach.size[1]}, {trong_suot:.0f}% trong suốt")

    THU_MUC_RA.mkdir(parents=True, exist_ok=True)
    tong = 0
    for ten, canh in KICH_THUOC:
        anh = sach.resize((canh, canh), Image.Resampling.LANCZOS)
        if canh >= 64:
            anh = toi_uu(anh)
        duong_dan = THU_MUC_RA / ten
        anh.save(duong_dan, "PNG", optimize=True)
        kb = duong_dan.stat().st_size / 1024
        tong += kb
        print(f"  → brand/{ten:<22} {canh:>3}px  {kb:6.1f} KB")

    # favicon.ico gộp nhiều kích thước cho trình duyệt cũ và thanh địa chỉ
    sach.resize((256, 256), Image.Resampling.LANCZOS).save(
        FAVICON_ICO, "ICO", sizes=[(16, 16), (32, 32), (48, 48)]
    )
    kb = FAVICON_ICO.stat().st_size / 1024
    tong += kb
    print(f"  → favicon.ico              đa cỡ  {kb:6.1f} KB")
    print(f"Tổng bộ nhận diện: {tong:.1f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
