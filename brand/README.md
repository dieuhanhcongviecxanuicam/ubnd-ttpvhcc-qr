# Nguồn thiết kế thương hiệu

Thư mục này chỉ chứa **một file gốc duy nhất**:

| File | Mô tả |
|---|---|
| `logo-ttpvhcc.png` | Logo Trung tâm Phục vụ hành chính công, 1254x1254, nền trắng |

Toàn bộ logo, favicon và icon PWA mà website phục vụ đều được sinh ra từ file này
bằng một lệnh:

```bash
python3 scripts/tao-bo-nhan-dien.py
```

Script tự tách nền trắng bằng thuật toán loang từ viền ảnh (không phải đổi mọi
pixel trắng thành trong suốt), cắt viền thừa, rồi xuất ra `public/`:

```
public/
├── favicon.ico                  # Đa cỡ 16/32/48, trình duyệt tự yêu cầu ở gốc
└── brand/
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── apple-touch-icon.png     # 180x180, màn hình chính iOS
    ├── icon-192.png             # PWA / Android
    ├── icon-512.png             # PWA / Android
    ├── logo.png                 # 128x128, logo trên thanh điều hướng
    └── logo-512.png             # Ảnh chia sẻ mạng xã hội
```

**Đổi logo:** thay `logo-ttpvhcc.png` rồi chạy lại script - không phải sửa file
nào khác. Nếu logo mới có nền không phải màu trắng, chỉnh `NGUONG_NEN` trong
`scripts/tao-bo-nhan-dien.py`.

Định dạng đầu ra là PNG cho tất cả: favicon, apple-touch-icon và manifest PWA đều
bắt buộc PNG theo chuẩn, nên dùng chung một định dạng giúp tránh trùng lặp và
nhầm lẫn khi cập nhật.
