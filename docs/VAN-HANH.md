# Hướng dẫn vận hành

Tài liệu dành cho cán bộ phụ trách hệ thống. Ba việc thường gặp nhất nằm ở mục 1–3.

---

## 1. Cập nhật danh mục thủ tục hành chính

Khi có quyết định công bố TTHC mới (thêm, sửa, bãi bỏ thủ tục):

```bash
# Kích hoạt môi trường Python (lần đầu xem mục 5)
source .venv/bin/activate

# 1. Chép file Excel danh mục mới vào data/source/
# 2. Trích xuất lại dữ liệu
python3 scripts/trich-xuat-du-lieu.py

# 3. Sinh lại mã QR (số lĩnh vực có thể thay đổi)
python3 scripts/tao-ma-qr.py

# 4. Xác nhận mã QR trỏ đúng
python3 scripts/kiem-tra-ma-qr.py

# 5. Đẩy lên — hệ thống tự triển khai sau khoảng 2–3 phút
git add data public/qr
git commit -m "Cập nhật danh mục TTHC theo Quyết định số ..."
git push
```

**Quan trọng:** nếu danh sách lĩnh vực thay đổi thì mã QR của các lĩnh vực đó cũng
đổi. Phải **in và dán lại** mã QR tại quầy tương ứng. Bước 4 sẽ báo lỗi nếu có mã
QR nào không khớp.

## 2. In mã QR để dán tại quầy

1. Mở trang `/in-ma-qr/` trên website.
2. Đối chiếu URL nhỏ dưới mỗi mã QR — phải đúng tên miền đang triển khai.
3. Bấm **In trang này**, chọn khổ A4, bật *In hình nền/màu nền* để mã QR rõ nét.
4. Muốn in riêng một lĩnh vực: mở trang lĩnh vực đó và bấm **PNG** (in ấn) hoặc
   **SVG** (phóng to cỡ lớn không bị vỡ nét).

Trước khi dán, hãy dùng điện thoại quét thử ít nhất 2–3 mã bất kỳ.

## 3. Chuyển sang tên miền chính thức

Địa chỉ đích nằm **bên trong ảnh mã QR**, nên đổi tên miền bắt buộc phải sinh lại
và in lại toàn bộ mã QR.

```bash
export TEN_MIEN=https://tthc.donvi.gov.vn

python3 scripts/tao-ma-qr.py      --base-url $TEN_MIEN
python3 scripts/kiem-tra-ma-qr.py --base-url $TEN_MIEN
```

Sau đó sửa `.github/workflows/deploy.yml`: bỏ dòng `NEXT_PUBLIC_BASE_PATH` và đặt
`NEXT_PUBLIC_SITE_ORIGIN: https://tthc.donvi.gov.vn`, rồi trỏ bản ghi DNS về
GitHub Pages (hoặc chuyển sang hạ tầng của đơn vị bằng cách chép thư mục `out/`).

Cuối cùng: **thu hồi và thay thế toàn bộ mã QR đã dán** — mã cũ vẫn trỏ về tên
miền cũ.

## 4. Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Quét QR ra trang lỗi 404 | QR sinh theo tên miền khác với nơi đang triển khai | `python3 scripts/kiem-tra-ma-qr.py` rồi sinh lại, in lại |
| Website không cập nhật sau khi push | Workflow triển khai thất bại | Xem tab **Actions** trên GitHub |
| Trang trắng, thiếu định dạng | Thiếu `.nojekyll` nên GitHub Pages bỏ qua thư mục `_next/` | Kiểm tra bước "Thêm .nojekyll" trong `deploy.yml` |
| Số thủ tục hiển thị sai | `data/meta.json` chưa được sinh lại | Chạy lại `scripts/trich-xuat-du-lieu.py` |
| Script báo "slug lĩnh vực bị trùng" | Hai lĩnh vực khác nhau cho ra cùng một slug | Sửa tên lĩnh vực trong file Excel cho phân biệt được |

## 5. Chuẩn bị môi trường (làm một lần)

```bash
# Node.js 20 trở lên
npm install

# Python
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements-dev.txt
```

## 6. Sao lưu

Cần giữ lại: **file Excel nguồn** (`data/source/`, không nằm trong Git) và toàn bộ
kho mã nguồn trên GitHub. Có hai thứ này là dựng lại được toàn bộ hệ thống.
