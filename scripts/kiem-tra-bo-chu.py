#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Đối chiếu bộ chữ tự host với ký tự thực sự có trong dữ liệu.

Vì sao cần: từ khi tự host (xem scripts/tao-bo-chu.py), bộ chữ được cắt xuống
đúng phần latin và tiếng Việt. Nếu lần cập nhật Excel sau đưa vào một ký tự nằm
ngoài phần đã cắt, trình duyệt sẽ lặng lẽ rơi về chữ hệ thống cho riêng ký tự đó
- trang vẫn hiện, build vẫn xanh, test vẫn qua, chỉ có chữ bị lệch kiểu giữa
dòng. Đúng lớp lỗi âm thầm mà dự án đã dựng hàng rào cho trợ năng và mã QR.

Cách dùng:
    python3 scripts/kiem-tra-bo-chu.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from fontTools.ttLib import TTFont

GOC_DU_AN = Path(__file__).resolve().parent.parent
THU_MUC_CHU = GOC_DU_AN / "src" / "fonts"

# Chữ nội dung phải phủ mọi ký tự. Lora chỉ dựng tiêu đề và IBM Plex Mono chỉ
# dựng mã thủ tục, nhưng vẫn kiểm cả bốn: rẻ, và bắt được trường hợp bộ sinh
# chạy hụt một file.
CAC_BO = [
    ("Inter (chữ nội dung)", "inter-viet.woff2"),
    ("Lora (tiêu đề)", "lora-viet.woff2"),
    ("IBM Plex Mono 500", "plex-mono-500.woff2"),
    ("IBM Plex Mono 600", "plex-mono-600.woff2"),
]

# Ký tự lạc trong dữ liệu nguồn, chấp nhận rơi về chữ hệ thống. Bản chưa tự host
# cũng không phủ chúng, nên đây không phải bước lùi.
#   U+0420 - chữ Р của bảng Kirin, lọt vào từ một ô trong Excel gốc.
#   U+200E - dấu đánh chiều viết trái-sang-phải, vô hình, không cần glyph.
NGOAI_LE = {0x0420, 0x200E}


def quet(x, tap: set[str]) -> None:
    if isinstance(x, str):
        tap.update(x)
    elif isinstance(x, dict):
        for v in x.values():
            quet(v, tap)
    elif isinstance(x, list):
        for v in x:
            quet(v, tap)


def main() -> int:
    ky_tu: set[str] = set()
    for ten in ("tthc.json", "linh-vuc.json", "meta.json"):
        quet(json.loads((GOC_DU_AN / "data" / ten).read_text(encoding="utf-8")), ky_tu)
    ma = {ord(c) for c in ky_tu if c not in "\n\r\t"} - NGOAI_LE
    print(f"Dữ liệu dùng {len(ma)} ký tự (đã trừ {len(NGOAI_LE)} ngoại lệ đã biết).")

    loi = False
    for ten, tep in CAC_BO:
        duong_dan = THU_MUC_CHU / tep
        if not duong_dan.exists():
            print(f"BỘ CHỮ: thiếu {duong_dan.relative_to(GOC_DU_AN)} - "
                  f"chạy scripts/tao-bo-chu.py", file=sys.stderr)
            loi = True
            continue
        cmap = TTFont(str(duong_dan)).getBestCmap()
        thieu = sorted(c for c in ma if c not in cmap)
        if thieu:
            mau = " ".join(f"U+{c:04X}({chr(c)})" for c in thieu[:10])
            print(f"BỘ CHỮ: {ten} thiếu {len(thieu)} ký tự: {mau}", file=sys.stderr)
            print("  Thêm dải tương ứng vào DAI_UNICODE trong scripts/tao-bo-chu.py "
                  "rồi chạy lại script đó.", file=sys.stderr)
            loi = True
        else:
            print(f"  {ten}: đủ ({len(cmap)} ký tự trong bộ)")

    if loi:
        return 1
    print("BỘ CHỮ: cả 4 bộ phủ hết ký tự trong dữ liệu.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
