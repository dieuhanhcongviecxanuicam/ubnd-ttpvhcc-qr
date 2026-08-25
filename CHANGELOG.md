# Nhật ký thay đổi

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/).

## [1.0.0] — 2026-08-25

Chuẩn hoá toàn bộ dự án từ bản MVP tĩnh sang kiến trúc Next.js triển khai được.

### Sửa lỗi

- **Toàn bộ 77 mã QR lĩnh vực trỏ tới trang không tồn tại.** Mã QR mã hoá đường
  dẫn `/linh-vuc/<slug>` trong khi website chỉ phục vụ `linh-vuc.html?slug=<slug>`
  — mọi mã QR lĩnh vực nếu đem in sẽ dẫn tới lỗi 404. Nay website sinh sẵn đúng
  route `/linh-vuc/<slug>/` và có script tự đối chiếu để lỗi này không tái diễn.
- Đường dẫn tuyệt đối `/home/claude/...` và `/mnt/user-data/...` trong hai script
  Python khiến chúng không chạy được trên máy khác; chuyển sang đường dẫn tương đối.
- Số liệu "376 TTHC · 77 lĩnh vực" và ngày cập nhật bị viết cứng trong HTML,
  không khớp khi dữ liệu đổi; nay đọc từ `data/meta.json`.
- Mã QR bản SVG bị vẽ màu đen trong khi bản PNG màu đỏ son; nay đồng bộ màu.

### Thêm mới

- Kiến trúc Next.js 16 (App Router) với static export — 455 trang sinh sẵn lúc build.
- Trang `/in-ma-qr/`: bảng in khổ A4 toàn bộ mã QR kèm tên lĩnh vực và URL đối chiếu.
- `scripts/kiem-tra-ma-qr.py`: giải mã ngược ảnh QR và đối chiếu với route thật.
- Lọc theo cấp thực hiện, phân trang, xoá bộ lọc ở trang danh mục.
- SEO: metadata riêng từng trang, Open Graph, `sitemap.xml` (455 URL), `robots.txt`.
- Trợ năng: liên kết bỏ qua điều hướng, nhãn cho mọi ô nhập, vùng thông báo kết quả.
- CI/CD GitHub Actions: typecheck, lint, build, kiểm tra mã QR, tự triển khai Pages.
- `LICENSE`, `.gitignore`, `.editorconfig`, `.nvmrc`, tài liệu vận hành.

### Thay đổi

- **Hiệu năng:** dữ liệu 5,3 MB nay chỉ đọc lúc build. Trang chi tiết TTHC giảm từ
  ~5,3 MB tải về xuống ~104 KB; trang lĩnh vực còn ~36 KB.
- Font tự host lúc build (`next/font`) thay vì gọi Google Fonts lúc chạy.
- Cấu trúc thư mục chuẩn hoá: `data/`, `public/`, `scripts/`, `src/`.
- Cấu hình tập trung ở `src/lib/site-config.ts`, điều khiển qua biến môi trường.
