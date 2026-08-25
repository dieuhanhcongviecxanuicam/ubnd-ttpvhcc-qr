# Nguồn thiết kế thương hiệu

Thư mục này chỉ chứa **file gốc** để sinh lại bộ biểu tượng khi cần:

| File | Dùng để |
|---|---|
| `logo-master.webp` | Logo (1493×1517) - sinh `public/brand/logo*.png` |
| `favicon-master.webp` | Biểu tượng vuông (2007×2007) - sinh favicon và icon PWA |

**File website thực sự phục vụ nằm ở `public/`**, không phải ở đây:

```
public/
├── favicon.ico                  # Trình duyệt tự yêu cầu ở đường dẫn gốc
└── brand/
    ├── favicon-16x16.png
    ├── favicon-32x32.png
    ├── apple-touch-icon.png     # 180×180, màn hình chính iOS
    ├── icon-192.png             # PWA / Android
    ├── icon-512.png             # PWA / Android, ảnh chia sẻ mạng xã hội
    ├── logo.png                 # 128×128, logo trên thanh điều hướng
    └── logo-512.png
```

Sửa logo thì thay file gốc ở đây rồi xuất lại các kích thước sang `public/brand/`.
