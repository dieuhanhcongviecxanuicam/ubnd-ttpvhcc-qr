# Dữ liệu nguồn

Thư mục này chứa file Excel danh mục TTHC do đơn vị cung cấp. Nội dung **không
được đưa lên Git** (xem `.gitignore`) vì là file nghiệp vụ nội bộ, dung lượng lớn
và luôn có bản chính thức ở đơn vị.

Đặt file `.xlsx` vào đây rồi chạy:

```bash
python3 scripts/trich-xuat-du-lieu.py
python3 scripts/tao-ma-qr.py
```

Sheet mà script cần đọc: `TTHC2-CAPXA` (bắt buộc), `Cách thức thực hiện`,
`Trình tự thực hiện`, `TPHS`, `KQTH`, `CCPL`, `TTHC` (tuỳ chọn - thiếu thì bỏ qua).
