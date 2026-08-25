# Nhật ký thay đổi

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/).

## [1.5.0] - 2026-08-25

### Sửa lỗi

- **Danh sách thả xuống "Tất cả lĩnh vực" tràn khỏi màn hình điện thoại.** Tên
  lĩnh vực dài hơn 60 ký tự kéo giãn thẻ `select` vượt quá bề ngang khung nhìn.
  Nay khống chế bằng `max-width` kèm cắt chữ, và trên màn hình dưới 640px thì các
  ô lọc xếp dọc chiếm trọn chiều ngang.

### Thêm mới

- **Tô sáng từ khoá theo thời gian thực** trong kết quả tìm kiếm. So khớp bỏ dấu
  nên gõ "ho tich" vẫn tô đúng chữ "Hộ tịch" có dấu - thực hiện bằng cách chuẩn
  hoá chuỗi kèm bảng ánh xạ vị trí về chuỗi gốc (`chuanHoaCoViTri` trong
  `src/lib/text.ts`), áp dụng cho mã TTHC, tên thủ tục, tên lĩnh vực.
- **Nút "In từng mã"** ở trang `/in-ma-qr`: mỗi mã QR chiếm trọn một trang giấy,
  tự co theo khổ người dùng chọn trong hộp thoại in. Đã kiểm chứng bằng cách xuất
  PDF thật: đúng 78 trang cho 78 mã ở cả A4 lẫn A5, không sinh trang trắng.

### Thay đổi

- Mũi tên trong danh sách thả xuống chuyển sang biểu tượng chevron tuỳ biến,
  đồng nhất trên mọi trình duyệt và hệ điều hành.
- Trên màn hình dưới 640px, các thẻ nội dung ở trang chi tiết TTHC tràn sát hai
  biên màn hình. Lề trang 24px cộng lề trong thẻ 24px vốn ăn mất 96px - hơn một
  phần tư chiều ngang ở khung 360px.
- Trang chủ: bổ sung tên đơn vị "ỦY BAN NHÂN DÂN XÃ NÚI CẤM" và "TRUNG TÂM PHỤC
  VỤ HÀNH CHÍNH CÔNG" căn giữa; gỡ các đoạn mô tả dài; rút gọn tiêu đề chính.
- Favicon chuyển sang dùng bộ trong `brand/favicon/` nguyên bản thay vì sinh từ
  logo. Logo giữ nguyên `logo-ttpvhcc.png`.

## [1.4.0] - 2026-08-25

### Thay đổi

- **Mã QR chuyển sang màu đen tuyền** thay cho đỏ son. Tương phản cao nhất trên
  nền trắng nên máy quét đọc nhanh và chắc hơn, kể cả khi bản in phai màu hoặc
  thiếu sáng tại quầy.
- **URL bỏ dấu "/" ở cuối**: `/in-ma-qr/` thành `/in-ma-qr`. Toàn bộ 78 mã QR đã
  sinh lại theo địa chỉ mới, cùng sitemap, canonical và liên kết nội bộ.
- **Logo mới** `logo-ttpvhcc.png` thay cho bộ cũ. Nền trắng được tách bằng thuật
  toán loang từ viền ảnh, giữ mép mượt, hiển thị sạch trên cả nền sáng lẫn nền tối.
  Favicon và icon PWA cũng sinh lại từ logo mới để đồng bộ nhận diện.
- Thêm `scripts/tao-bo-nhan-dien.py` - sinh toàn bộ logo, favicon, icon PWA từ
  một file gốc duy nhất bằng một lệnh.
- Thay toàn bộ dấu gạch dài "-" và "-" thành gạch ngắn "-" trong mã nguồn và tài
  liệu (81 ký tự, 29 file). Dữ liệu TTHC không bị đụng tới vì là văn bản công bố
  chính thức - kiểm tra cho thấy dữ liệu vốn không chứa ký tự này.

## [1.3.0] - 2026-08-25

### Sửa lỗi

- **Mã QR bị méo trên điện thoại.** Phần reset ảnh thiếu `height: auto`, trong khi
  `next/image` gắn sẵn thuộc tính `width`/`height` vào thẻ - nên khi CSS chỉ đặt
  `width: 100%`, chiều cao giữ nguyên 200px và ảnh bị kéo dãn. Ở khung 360px, mã
  QR trang lĩnh vực rộng còn ~92px nhưng cao 200px, không quét được.
- **Hai dòng chữ dính liền nhau** trong danh sách thủ tục (`…cấp xãCấp xã`): markup
  dùng `<span>` (inline) trong khi CSS viết cho thẻ block, khiến `margin-top` mất
  tác dụng. Đã đặt `display: block` cho `.ten` và `.linh-vuc-nhan`.

### Thay đổi

- Trang lĩnh vực trên màn hình dưới 640px nay xếp mã QR lên trên tiêu đề thay vì
  chia hai cột - mã QR đạt ~210px, đủ lớn để quét từ màn hình.
- Thay vòng tròn chữ "QR" bằng logo chính thức của đơn vị trên thanh điều hướng.
- Bổ sung bộ nhận diện: `favicon.ico`, favicon 16/32px, apple-touch-icon 180px,
  icon PWA 192/512px, ảnh chia sẻ mạng xã hội, và `manifest.webmanifest`.
- Sắp xếp lại tài nguyên thương hiệu: file gốc thiết kế ở `brand/`, file website
  phục vụ ở `public/brand/`. Gỡ bỏ các bản dư thừa (ảnh nền đăng nhập 3,8 MB không
  dùng đến vì dự án không có trang đăng nhập, và các biến thể webp không tham chiếu).

## [1.2.0] - 2026-08-25

### Thay đổi

- Chuyển quyền sở hữu kho mã nguồn sang tài khoản **dieuhanhcongviecxanuicam**;
  địa chỉ repo mới: `github.com/dieuhanhcongviecxanuicam/ubnd-ttpvhcc-qr`.
- Cập nhật `LICENSE` và tài liệu vận hành theo chủ sở hữu mới.
- Ghi nhận cấu hình DNS đang dùng: Cloudflare chế độ *DNS only*, bản ghi
  `CNAME ttpvhcc → dieuhanhcongviecxanuicam.github.io`.

## [1.1.0] - 2026-08-25

Chuyển sang tên miền chính thức **ttpvhcc.xanuicam.vn**.

### Sửa lỗi

- **Công cụ kiểm chứng mã QR báo lỗi giả.** `kiem-tra-ma-qr.py` dùng bộ giải mã
  của OpenCV, vốn đọc hụt mã QR từ version 5 trở lên - hai lĩnh vực có slug dài
  (`giao-duc-nghe-nghiep-g07-ld06`, `quan-ly-chuong-trinh-muc-tieu-quoc-gia`) bị
  báo sai dù mã hoàn toàn hợp lệ. Đã chuyển sang **zxing-cpp**, cùng engine với
  phần lớn ứng dụng quét QR trên điện thoại.

### Thay đổi

- Toàn bộ 78 mã QR sinh lại theo tên miền `https://ttpvhcc.xanuicam.vn`.
- Vùng yên tĩnh quanh mã QR tăng từ 2 lên **4 module** theo ISO/IEC 18004 -
  giảm rủi ro quét lỗi khi in sát nội dung khác.
- Thêm `public/CNAME`; CI và workflow triển khai đều kiểm tra file này còn nằm
  trong bản build, vì thiếu nó là GitHub Pages gỡ cấu hình tên miền riêng.
- Bỏ `NEXT_PUBLIC_BASE_PATH` khỏi workflow - tên miền riêng phục vụ ngay từ gốc.

## [1.0.0] - 2026-08-25

Chuẩn hoá toàn bộ dự án từ bản MVP tĩnh sang kiến trúc Next.js triển khai được.

### Sửa lỗi

- **Toàn bộ 77 mã QR lĩnh vực trỏ tới trang không tồn tại.** Mã QR mã hoá đường
  dẫn `/linh-vuc/<slug>` trong khi website chỉ phục vụ `linh-vuc.html?slug=<slug>`
  - mọi mã QR lĩnh vực nếu đem in sẽ dẫn tới lỗi 404. Nay website sinh sẵn đúng
  route `/linh-vuc/<slug>/` và có script tự đối chiếu để lỗi này không tái diễn.
- Đường dẫn tuyệt đối `/home/claude/...` và `/mnt/user-data/...` trong hai script
  Python khiến chúng không chạy được trên máy khác; chuyển sang đường dẫn tương đối.
- Số liệu "376 TTHC · 77 lĩnh vực" và ngày cập nhật bị viết cứng trong HTML,
  không khớp khi dữ liệu đổi; nay đọc từ `data/meta.json`.
- Mã QR bản SVG bị vẽ màu đen trong khi bản PNG màu đỏ son; nay đồng bộ màu.

### Thêm mới

- Kiến trúc Next.js 16 (App Router) với static export - 455 trang sinh sẵn lúc build.
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
