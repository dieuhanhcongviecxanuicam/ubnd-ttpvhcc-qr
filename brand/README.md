# Nguồn thiết kế thương hiệu

Hai nguồn **tách biệt, cố ý không trộn lẫn**:

| Nguồn | Dùng cho |
|---|---|
| `logo-ttpvhcc.png` | Logo hiển thị trên trang - được tách nền trong suốt khi sinh |
| `favicon/` | Favicon và icon PWA - **dùng nguyên bản, không sinh lại từ logo** |

Favicon là dạng huy hiệu tròn nền đỏ, thiết kế riêng để đọc được ở cỡ 16px. Nếu
thu nhỏ logo (nền trong suốt, nhiều nét mảnh) xuống 16px thì chỉ còn một vệt mờ -
đó là lý do hai nguồn phải tách riêng.

Sinh lại toàn bộ:

```bash
python3 scripts/tao-bo-nhan-dien.py
```

Kết quả ghi vào `public/`:

```
public/
├── favicon.ico                  # từ brand/favicon/, trình duyệt yêu cầu ở gốc
└── brand/
    ├── favicon-16x16.png        # từ brand/favicon/
    ├── favicon-32x32.png        # từ brand/favicon/
    ├── apple-touch-icon.png     # từ brand/favicon/, màn hình chính iOS
    ├── icon-192.png             # từ brand/favicon/android-chrome-192x192.png
    ├── icon-512.png             # từ brand/favicon/android-chrome-512x512.png
    ├── logo.png                 # từ logo-ttpvhcc.png, 128px, thanh điều hướng
    └── logo-512.png             # từ logo-ttpvhcc.png, ảnh chia sẻ mạng xã hội
```

**Đổi logo:** thay `logo-ttpvhcc.png` rồi chạy lại script. Nếu logo mới có nền
không phải màu trắng, chỉnh `NGUONG_NEN` trong `scripts/tao-bo-nhan-dien.py`.

**Đổi favicon:** thay các file trong `favicon/` (giữ đúng tên) rồi chạy lại script.
