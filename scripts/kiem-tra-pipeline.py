#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chạy khứ hồi pipeline trích xuất dữ liệu và đối chiếu kết quả.

Vì sao cần: file Excel thật của đơn vị không nằm trong Git, nên bước trích xuất
- phần đơn vị dùng thường xuyên nhất - trước đây không có gì kiểm thử. Sửa
trich-xuat-du-lieu.py mà làm hỏng một cột thì không ai biết cho tới lúc đơn vị
cập nhật dữ liệu thật.

Cách làm: dựng lại file Excel từ data/tthc.json đang có (scripts/dung-excel-mau.py),
chạy trich-xuat-du-lieu.py trên đó, rồi so kết quả với dữ liệu gốc.

Chạy trong thư mục tạm, KHÔNG đụng vào data/ của kho mã.

Cách dùng:
    python3 scripts/kiem-tra-pipeline.py
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

GOC_DU_AN = Path(__file__).resolve().parent.parent

# Bộ trích xuất bản mới chuẩn hoá lĩnh vực rỗng thành "Chưa phân loại", còn
# data/tthc.json trong kho được sinh bằng bản cũ chưa có bước đó. Website hiển
# thị đúng ở cả hai trường hợp vì frontend có sẵn bước dự phòng tương tự. Chênh
# lệch này sẽ tự hết ở lần đơn vị cập nhật dữ liệu từ Excel thật tiếp theo.
LECH_DA_BIET = {"linh_vuc": ("", "Chưa phân loại")}
SO_BAN_GHI_LECH_TOI_DA = 7


def chay(*lenh: str, cwd: Path) -> None:
    kq = subprocess.run(lenh, cwd=cwd, capture_output=True, text=True)
    if kq.returncode != 0:
        print(f"LỖI khi chạy: {' '.join(lenh)}", file=sys.stderr)
        print(kq.stdout, file=sys.stderr)
        print(kq.stderr, file=sys.stderr)
        sys.exit(1)


def main() -> int:
    goc = json.loads((GOC_DU_AN / "data" / "meta.json").read_text(encoding="utf-8"))
    ngay_xuat = goc["ngay_xuat"]

    with tempfile.TemporaryDirectory() as tmp:
        tam = Path(tmp)
        # Bản sao tối thiểu của dự án: script + dữ liệu, đủ để chạy pipeline.
        shutil.copytree(GOC_DU_AN / "scripts", tam / "scripts")
        shutil.copytree(GOC_DU_AN / "data", tam / "data", ignore=shutil.ignore_patterns("source"))
        excel = tam / "mau.xlsx"

        chay(sys.executable, "scripts/dung-excel-mau.py", str(GOC_DU_AN), str(excel), cwd=tam)
        chay(sys.executable, "scripts/trich-xuat-du-lieu.py", str(excel),
             "--ngay-xuat", ngay_xuat, cwd=tam)

        loi: list[str] = []
        for ten in ("meta.json", "linh-vuc.json"):
            a = json.loads((GOC_DU_AN / "data" / ten).read_text(encoding="utf-8"))
            b = json.loads((tam / "data" / ten).read_text(encoding="utf-8"))
            if a != b:
                loi.append(f"{ten}: pipeline sinh ra kết quả khác dữ liệu trong kho")
            else:
                print(f"  {ten}: khớp")

        a = json.loads((GOC_DU_AN / "data" / "tthc.json").read_text(encoding="utf-8"))
        b = json.loads((tam / "data" / "tthc.json").read_text(encoding="utf-8"))
        if len(a) != len(b):
            loi.append(f"tthc.json: số bản ghi lệch ({len(a)} so với {len(b)})")
        else:
            lech_la = []
            so_lech = 0
            for x, y in zip(a, b):
                if x == y:
                    continue
                so_lech += 1
                for khoa in set(x) | set(y):
                    if x.get(khoa) == y.get(khoa):
                        continue
                    if LECH_DA_BIET.get(khoa) != (x.get(khoa), y.get(khoa)):
                        lech_la.append(f"{x.get('ma_tthc')}.{khoa}: "
                                       f"{x.get(khoa)!r} -> {y.get(khoa)!r}")
            if lech_la:
                loi.append(f"tthc.json: {len(lech_la)} chênh lệch NGOÀI dự kiến")
                loi.extend(f"    {d}" for d in lech_la[:10])
            elif so_lech > SO_BAN_GHI_LECH_TOI_DA:
                loi.append(f"tthc.json: {so_lech} bản ghi lệch, nhiều hơn mức đã biết "
                           f"({SO_BAN_GHI_LECH_TOI_DA})")
            else:
                print(f"  tthc.json: {len(a)} bản ghi, {so_lech} bản ghi lệch - "
                      f"đều thuộc chênh lệch đã biết (lĩnh vực rỗng)")

        if loi:
            print("PIPELINE: phát hiện vấn đề:", file=sys.stderr)
            for d in loi:
                print(f"  - {d}", file=sys.stderr)
            return 1

    print("PIPELINE: chạy khứ hồi thành công, dữ liệu sinh ra khớp với kho mã.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
