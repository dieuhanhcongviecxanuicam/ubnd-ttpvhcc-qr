#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sinh bộ chữ tự host: mỗi họ MỘT file, phủ trọn latin và tiếng Việt.

Vì sao cần: Google Fonts cắt mỗi họ/weight thành nhiều @font-face theo
`unicode-range`, và dấu tiếng Việt nằm ở file khác với chữ cái không dấu. Hậu quả
đo được (xem docs/HIEU-NANG.md mục 4):

  - Chữ "Giải" phải tạo hình bằng HAI file font. Trên trang chi tiết 18.600 ký
    tự, việc xé đoạn này làm chữ có dấu đắt hơn chữ bỏ dấu 49,6%, trong khi với
    một bộ chữ phủ trọn thì chỉ 17,9%.
  - 62 khai báo @font-face được nhúng vào MỌI trang, trong đó 44 khai báo không
    bao giờ dùng tới. Riêng phần này chiếm 21,9 KB trong 39,4 KB CSS nhúng, và
    CSS đó lại được nhúng ba lần mỗi trang (một trong <style>, hai trong payload
    RSC).

Cách làm: tải bản gốc từ kho google/fonts, ghim các trục không dùng, giới hạn
trục `wght` về đúng khoảng site cần, rồi subset xuống đúng ba dải unicode mà
trình duyệt thực sự tải.

Chạy lại khi nào: khi đổi họ chữ, đổi weight dùng trong globals.css, hoặc muốn
cập nhật bản font mới. Kết quả đã commit vào src/fonts/ nên build và CI không cần
mạng - giống cách scripts/tao-bo-nhan-dien.py sinh sẵn logo và favicon.

Cách dùng:
    pip install fonttools brotli
    python3 scripts/tao-bo-chu.py
"""
from __future__ import annotations

import subprocess
import sys
import time
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

GOC_DU_AN = Path(__file__).resolve().parent.parent
THU_MUC_RA = GOC_DU_AN / "src" / "fonts"
KHO = "https://raw.githubusercontent.com/google/fonts/main/"

# Đúng ba dải mà trình duyệt thực sự tải: latin, latin mở rộng, tiếng Việt.
# Chép nguyên từ CSS next/font sinh ra, để phần phủ ký tự không đổi một li.
DAI_UNICODE = [
    # tiếng Việt
    "U+102-103,U+110-111,U+128-129,U+168-169,U+1A0-1A1,U+1AF-1B0,U+300-301,"
    "U+303-304,U+308-309,U+323,U+329,U+1EA0-1EF9,U+20AB",
    # latin mở rộng
    "U+100-2BA,U+2BD-2C5,U+2C7-2CC,U+2CE-2D7,U+2DD-2FF,U+304,U+308,U+329,"
    "U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,"
    "U+2113,U+2C60-2C7F,U+A720-A7FF",
    # Dấu tổ hợp. Bản Google Fonts chỉ có lác đác vài dấu (U+300-301, U+303-304,
    # U+308-309, U+323, U+329) nên chữ Việt dạng PHÂN TÁCH - "ê" viết thành
    # e + U+0302 - không hiện đúng. Dữ liệu nguồn của đơn vị có lẫn dạng này.
    "U+300-36F",
    # latin
    "U+0-FF,U+131,U+152-153,U+2BB-2BC,U+2C6,U+2DA,U+2DC,U+304,U+308,U+329,"
    "U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
]

# `wght` giới hạn theo weight THỰC SỰ dùng trong src/app/globals.css. Đã đối
# chiếu bằng cách nạp cả sáu loại trang và đọc document.fonts:
#   Inter 400/500/600/700 - Lora 600/700 - IBM Plex Mono 500/600.
# Lora khai 500 nhưng không trang nào dùng, nên bỏ.
BO_CHU = [
    {
        "ten": "Inter",
        "nguon": "ofl/inter/Inter[opsz,wght].ttf",
        "ra": "inter-viet.woff2",
        # opsz mặc định 14; bản Google Fonts đang phục vụ cũng ghim đúng giá trị này.
        "ghim": {"opsz": 14},
        "wght": (400, 700),
    },
    {
        "ten": "Lora",
        "nguon": "ofl/lora/Lora[wght].ttf",
        "ra": "lora-viet.woff2",
        "ghim": {},
        "wght": (600, 700),
    },
    # IBM Plex Mono trên Google Fonts là bộ chữ tĩnh, không có trục biến thiên,
    # nên mỗi weight vẫn là một file riêng.
    {
        "ten": "IBM Plex Mono 500",
        "nguon": "ofl/ibmplexmono/IBMPlexMono-Medium.ttf",
        "ra": "plex-mono-500.woff2",
        "ghim": {},
        "wght": None,
    },
    {
        "ten": "IBM Plex Mono 600",
        "nguon": "ofl/ibmplexmono/IBMPlexMono-SemiBold.ttf",
        "ra": "plex-mono-600.woff2",
        "ghim": {},
        "wght": None,
    },
]


def tai(duong_dan: str, so_lan: int = 4) -> bytes:
    """Tải kèm thử lại: kho font hay reset kết nối giữa chừng với file vài trăm KB."""
    url = KHO + urllib.parse.quote(duong_dan, safe="/")
    for lan in range(1, so_lan + 1):
        try:
            with urllib.request.urlopen(url, timeout=120) as p:
                return p.read()
        except (urllib.error.URLError, ConnectionError, TimeoutError) as loi:
            if lan == so_lan:
                raise
            print(f"    tải hụt ({type(loi).__name__}), thử lại {lan}/{so_lan - 1}",
                  file=sys.stderr)
            time.sleep(2 * lan)
    raise AssertionError("không tới được")


def khoang_unicode() -> str:
    """Gộp ba dải thành một chuỗi --unicodes cho pyftsubset."""
    phan_tu = []
    for dong in DAI_UNICODE:
        for phan in dong.split(","):
            phan_tu.append(phan.strip().upper().removeprefix("U+"))
    return ",".join(sorted(set(phan_tu)))


def main() -> int:
    THU_MUC_RA.mkdir(parents=True, exist_ok=True)
    ma = khoang_unicode()
    print(f"Phủ {len(ma.split(','))} khoảng mã (latin + latin mở rộng + tiếng Việt)")

    tong = 0
    for bo in BO_CHU:
        dich = THU_MUC_RA / bo["ra"]
        with tempfile.TemporaryDirectory() as tmp:
            nguon = Path(tmp) / "nguon.ttf"
            nguon.write_bytes(tai(bo["nguon"]))

            ghim = dict(bo["ghim"])
            if bo["wght"] is not None:
                ghim["wght"] = bo["wght"]
            if ghim:
                f = instancer.instantiateVariableFont(
                    TTFont(str(nguon)), ghim, inplace=False, updateFontNames=False
                )
                f.save(str(nguon))

            # Dùng CLI chứ không dùng API Subsetter: API vấp KeyError khi cắt
            # bảng `gvar` của bộ chữ biến thiên (glyph uni200B), còn CLI xử lý
            # đúng vì nó khép kín tập glyph theo cách khác.
            subprocess.run([
                "pyftsubset", str(nguon),
                f"--unicodes={ma}",
                "--layout-features=*",   # giữ kern, mark, mkmk - dấu tiếng Việt cần
                "--no-hinting", "--flavor=woff2",
                f"--output-file={dich}",
            ], check=True)

        f = TTFont(str(dich))
        cmap = f.getBestCmap()
        thieu = [c for c in range(0x1EA0, 0x1EFA) if c not in cmap]
        if thieu:
            print(f"LỖI: {bo['ten']} thiếu {len(thieu)} ký tự tiếng Việt", file=sys.stderr)
            return 1

        kb = dich.stat().st_size / 1024
        tong += kb
        truc = [a.axisTag for a in f["fvar"].axes] if "fvar" in f else []
        print(f"  {bo['ten']:20s} {kb:6.1f} KB  {len(cmap)} ký tự"
              f"{'  trục ' + ','.join(truc) if truc else '  (tĩnh)'}")

    print(f"\nTổng: {tong:.1f} KB trong {len(BO_CHU)} file.")
    print("Trước khi tự host: 251,0 KB trong 12 file.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
