#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kiểm chứng mã QR: giải mã ngược từng file PNG và đối chiếu với URL mà website
thực sự phục vụ.

Đây là lớp bảo vệ chống lại lỗi nguy hiểm nhất của hệ thống — mã QR đã in và dán
tại bộ phận một cửa nhưng trỏ tới địa chỉ không tồn tại. Hãy chạy script này mỗi
lần sinh lại mã QR hoặc trước khi đem in.

Cách dùng:
    python3 scripts/kiem-tra-ma-qr.py
    python3 scripts/kiem-tra-ma-qr.py --base-url https://ttpvhcc.xanuicam.vn

Yêu cầu: pip install -r scripts/requirements-dev.txt
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

try:
    import zxingcpp
    from PIL import Image
except ImportError:
    print(
        "LỖI: cần zxing-cpp và pillow để giải mã QR.\n"
        "    pip install -r scripts/requirements-dev.txt",
        file=sys.stderr,
    )
    raise SystemExit(1)

GOC_DU_AN = Path(__file__).resolve().parent.parent
THU_MUC_QR = GOC_DU_AN / "public" / "qr"
FILE_LINH_VUC = GOC_DU_AN / "data" / "linh-vuc.json"

ORIGIN_MAC_DINH = "https://ttpvhcc.xanuicam.vn"
BASE_PATH_MAC_DINH = ""


def lay_base_url(tham_so: str | None) -> str:
    if tham_so:
        return tham_so.rstrip("/")
    origin = os.environ.get("NEXT_PUBLIC_SITE_ORIGIN", ORIGIN_MAC_DINH).rstrip("/")
    base_path = os.environ.get("NEXT_PUBLIC_BASE_PATH", BASE_PATH_MAC_DINH).rstrip("/")
    return f"{origin}{base_path}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", help="Gốc URL cần đối chiếu")
    args = parser.parse_args()

    base_url = lay_base_url(args.base_url)

    def giai_ma(duong_dan: Path) -> str | None:
        """Giải mã bằng zxing-cpp — cùng engine với phần lớn ứng dụng quét QR trên
        điện thoại, nên kết quả sát với trải nghiệm thực tế của người dân."""
        if not duong_dan.exists():
            return None
        with Image.open(duong_dan) as anh:
            ket_qua = zxingcpp.read_barcode(anh.convert("RGB"))
        return ket_qua.text if ket_qua else None

    can_kiem_tra: list[tuple[Path, str]] = [
        (THU_MUC_QR / "master.png", f"{base_url}/")
    ]
    for lv in json.loads(FILE_LINH_VUC.read_text(encoding="utf-8")):
        can_kiem_tra.append(
            (
                THU_MUC_QR / f"lv-{lv['slug']}.png",
                f"{base_url}/linh-vuc/{lv['slug']}/",
            )
        )

    print(f"Đối chiếu {len(can_kiem_tra)} mã QR với gốc URL: {base_url}")

    loi: list[str] = []
    for duong_dan, mong_doi in can_kiem_tra:
        thuc_te = giai_ma(duong_dan)
        if thuc_te is None:
            loi.append(f"{duong_dan.name}: không đọc/giải mã được file")
        elif thuc_te != mong_doi:
            loi.append(f"{duong_dan.name}: {thuc_te!r} ≠ {mong_doi!r}")

    if loi:
        print(f"\nPHÁT HIỆN {len(loi)} MÃ QR SAI:", file=sys.stderr)
        for d in loi:
            print(f"  - {d}", file=sys.stderr)
        print("\nChạy lại: python3 scripts/tao-ma-qr.py", file=sys.stderr)
        return 1

    print(f"Tất cả {len(can_kiem_tra)} mã QR đều trỏ đúng địa chỉ.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
