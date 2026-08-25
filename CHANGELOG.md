# Nhật ký thay đổi

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/).

## [1.9.0] - 2026-08-26

### Thêm mới

- **Kiểm tra trợ năng tự động trong CI** (`scripts/kiem-tra-tro-nang.mjs`).
  `axe-core` vốn đã nằm trong phụ thuộc nhưng **không được dùng ở đâu cả** - con
  số "0 vi phạm WCAG AA" chỉ là kết quả một lần chạy tay. Trợ năng hỏng rất âm
  thầm: khi thử `content-visibility` để tối ưu hiệu năng, nó loại bốn tiêu đề mục
  khỏi cây trợ năng mà build vẫn xanh, 25/25 test vẫn qua, không bước CI nào phản
  ứng. Chạy trên trình duyệt thật (không phải jsdom, vì luật tương phản màu cần
  màu đã tính toán), khổ điện thoại, một trang cho mỗi loại bố cục. Đã kiểm chứng
  nó **bắt được lỗi thật** bằng cách chèn vi phạm tương phản vào bản build.
- **Kiểm tra khứ hồi pipeline dữ liệu trong CI** (`scripts/kiem-tra-pipeline.py`)
  cùng bộ sinh Excel mẫu (`scripts/dung-excel-mau.py`). File Excel thật của đơn vị
  không nằm trong Git nên bước trích xuất - phần đơn vị dùng thường xuyên nhất -
  trước đây không có gì kiểm thử. Đã kiểm chứng bắt được hồi quy: đổi lệch một chỉ
  số cột thì báo 370 chênh lệch ngoài dự kiến.
- `docs/HIEU-NANG.md` - số liệu hiệu năng cơ sở đo bằng Lighthouse trên trang thật.

### Thay đổi

- **Node 20 -> 24.19.0.** Node 20 hết vòng đời 30/04/2026, tức gần bốn tháng không
  còn bản vá bảo mật. Đã đối chiếu bản xuất tĩnh giữa hai phiên bản trên cả 458
  trang: 358 trang giống hệt, 100 trang còn lại chỉ khác vị trí một thẻ `meta` và
  số băm trong CSP. Bản dựng vốn không tất định (hai lần build cùng trên Node 20
  cũng cho 914 băm khác nhau), nên chênh lệch này nằm trong mức nhiễu.
- **Nhúng CSS vào HTML** (`experimental.inlineCss`). File CSS chặn hiển thị; bỏ
  được một vòng yêu cầu. Trên trang thật: FCP giảm 42-48%, LCP giảm 22-46%, điểm
  hiệu năng trang chủ 85 -> 89, lĩnh vực 87 -> 94, chi tiết 74 -> 77. Cái giá: TBT
  trang chi tiết nhích 8%, và mỗi trang xem tiếp trong phiên tốn thêm ~5,9 KB do
  CSS không còn cache dùng chung. Lượt truy cập đầu chỉ tăng 0,1 KB nhờ brotli.
- `github/codeql-action` 3.37.8 -> 4.37.8. Dependabot tách thành hai PR nhưng
  `init` và `analyze` **bắt buộc cùng phiên bản**, nâng riêng lẻ luôn thất bại với
  `configuration error`. Phải gộp một commit.
- `actions/upload-pages-artifact` 3.0.1 -> 5.0.0; `qrcode` >=8.2; `pillow` >=12.3.0.
  Với hai gói Python đã kiểm riêng: sinh lại toàn bộ 156 file mã QR cho kết quả
  **không lệch một byte**, thứ mà CI không phủ vì nó chỉ giải mã ngược ảnh có sẵn.

### Sửa lỗi

- `.tt-ma` khai `font-weight: 700` cho IBM Plex Mono nhưng `next/font` chỉ tải
  weight 500 và 600. Đổi về 600. Ảnh chụp giống hệt từng pixel - trình duyệt vốn
  đã dùng face 600 chứ không làm đậm giả.
- Đính chính `docs/HIEU-NANG.md`: nút thắt trang chi tiết **không phải** TBT/
  JavaScript như ghi ban đầu. Script Evaluation của trang chi tiết là 623 ms, còn
  thấp hơn trang lĩnh vực (676 ms); chênh lệch nằm trọn ở Style & Layout
  (1038 ms so với 354 ms).

### Ghi chú cho lần sau

- **Đừng dùng `content-visibility: auto`.** Nhanh nhất trong mọi phương án đã thử
  (-52% layout) nhưng loại nội dung ngoài tầm nhìn khỏi cây trợ năng: 746 nút tụt
  còn 200, và cuộn hết trang cũng không khôi phục.
- `contain: layout style paint` và `font-display: optional` là ngõ cụt: thoạt đo
  được -16% và -40%, chạy lại nhiều lần thì rơi vào nhiễu.
- `npx serve out` **đo nhầm trang**: với `/tthc/1.000110` thì cả thư mục lẫn file
  `.html` cùng tồn tại, và nó ưu tiên thư mục trong khi GitHub Pages làm ngược lại.
- Đo Lighthouse ngay sau khi triển khai cho số xấu giả vì cache Cloudflare còn
  nguội. Luôn đo lặp và bỏ lần đầu.

## [1.8.0] - 2026-08-26

### Sửa lỗi

- **117 vi phạm tương phản màu (WCAG 2.1 AA, mức serious).** Màu đồng `#A9793C`
  dùng cho mã TTHC chỉ đạt 3.64:1 trên nền thẻ, dưới ngưỡng 4.5:1 cho chữ thường -
  mà đây là thông tin người dân phải đọc chính xác. Đổi sang `#7E5822`, đạt tối
  thiểu 4.96:1 trên mọi nền đang dùng kể cả các nền có pha sắc đồng. Kiểm định lại
  bằng axe-core: **0 vi phạm** trên 8 trang ở cả khung 390px và 1280px.

### Thêm mới

- **Bộ test đầu tiên của dự án** (25 test), dùng bộ chạy có sẵn của Node thay vì
  thêm framework:
  - `tests/text.test.ts` - xử lý chuỗi tiếng Việt và thuật toán tô sáng từ khoá,
    gồm phép kiểm ánh xạ vị trí không bao giờ vượt ngoài chuỗi gốc.
  - `tests/du-lieu.test.ts` - **bất biến dữ liệu**: số đếm khớp danh sách, không
    có mã mồ côi, mỗi TTHC thuộc đúng một lĩnh vực, slug duy nhất và khớp giữa
    TypeScript với pipeline Python, mã QR đủ và không có file mồ côi. Đã cố tình
    tái hiện lỗi "Chưa phân loại" và xoá một file QR để xác nhận test bắt được.
- `CONTRIBUTING.md` và mẫu pull request, kèm mục nhắc kiểm tra ảnh hưởng tới mã QR
  đã in - thứ không sửa được sau khi dán tại quầy.
- Bước chạy test trong CI.

### Thay đổi

- Job CI đổi tên thành "Typecheck, lint, test, build"; đã cập nhật tên check tương
  ứng trong cấu hình bảo vệ nhánh. **Đổi tên job mà quên bước này sẽ khoá cứng mọi
  pull request** vì chờ một check không bao giờ xuất hiện - đã ghi vào CONTRIBUTING.

## [1.7.1] - 2026-08-26

### Thay đổi

- Siết CSP về **chỉ cho phép cùng miền** sau khi đơn vị tắt Cloudflare Web
  Analytics. Xác minh trên production: 0 request ra ngoài miền.
- Cập nhật `docs/BAO-MAT.md`: 7 header bảo mật đã cấu hình xong tại Cloudflare và
  xác minh hoạt động trên mọi đường dẫn. Bổ sung cảnh báo **không được mở rộng
  header CSP tại Cloudflare** - trang đã có CSP đầy đủ trong thẻ meta, hai chính
  sách cùng lúc sẽ được trình duyệt lấy giao, thêm directive vào header sẽ chặn
  luôn script của chính trang.
- Ghi nhận đơn vị đã có Quyết định phê duyệt cấp độ an toàn hệ thống thông tin.

### Kiểm chứng

- Chống nhúng khung: dựng trang lạ chứa iframe trỏ tới hệ thống, trình duyệt chặn
  đúng với thông báo vi phạm `frame-ancestors 'none'`.
- 7/7 header trên mọi loại đường dẫn: trang HTML, ảnh QR, sitemap, manifest, 404.
- Trang chạy sạch: 0 vi phạm CSP, 0 lỗi JavaScript, 0 request ra ngoài miền.

## [1.7.0] - 2026-08-26

Kiện toàn an toàn thông tin. Trọng tâm là chuỗi cung ứng và kiểm soát truy cập -
với kiến trúc tĩnh, đó mới là nơi có rủi ro thật, không phải tầng ứng dụng.

### Thêm mới

- **Content-Security-Policy theo từng trang**, sinh tự động sau build bởi
  `scripts/them-csp.mjs`. Băm SHA-256 từng khối script nội tuyến của Next nên
  `script-src` **không cần** `'unsafe-inline'`. Đã kiểm chứng bằng trình duyệt
  thật: 0 vi phạm trên 458 trang, mọi tương tác giữ nguyên.
- `scripts/kiem-tra-csp.mjs` chạy trong CI, chặn hai kiểu hỏng âm thầm: trang
  thiếu thẻ CSP, và băm không khớp script thật (trình duyệt chặn script làm trang
  trắng nhưng build vẫn báo thành công).
- Quét CodeQL cho JavaScript/TypeScript, chạy theo mỗi lần đẩy mã và hằng tuần.
- Dependabot theo dõi npm, pip và chính GitHub Actions.
- `pip-audit` và `npm audit` trong CI.
- `SECURITY.md` nêu kênh báo lỗ hổng riêng tư và cam kết thời gian xử lý.
- `docs/BAO-MAT.md`: kiến trúc phòng thủ, cấu hình header tại Cloudflare, lịch rà
  soát định kỳ và quy trình xử lý khi nghi ngờ bị xâm nhập.

### Thay đổi

- **Ghim toàn bộ 9 GitHub Action theo commit SHA** thay vì nhãn phiên bản. Nhãn
  có thể bị dịch sang commit khác; workflow triển khai giữ quyền `pages:write` và
  `id-token:write` nên một action bị chiếm là chiếm luôn quyền xuất bản trang.
- `npm run build` nay gồm cả bước sinh CSP.

### Ghi nhận

- Quá trình kiểm chứng CSP trên production phát hiện Cloudflare **tự chèn**
  `beacon.min.js` từ `static.cloudflareinsights.com` vào mọi trang ở tầng biên,
  dù kho mã không khai báo script nào bên ngoài. CSP đã được nới đúng một nguồn
  này để không sinh lỗi cho người truy cập, kèm hướng dẫn tắt hẳn nếu đơn vị
  không cần thống kê - xem `docs/BAO-MAT.md` mục 3.

## [1.6.0] - 2026-08-25

### Sửa lỗi

- **Lĩnh vực "Chưa phân loại" hiện "7 thủ tục" nhưng danh sách trống.** Bảy thủ
  tục được gom vào nhóm này lúc trích xuất, nhưng trường `linh_vuc` của chúng để
  rỗng, trong khi trang lĩnh vực lại lọc bản ghi theo tên lĩnh vực - không cái
  nào khớp. Nay danh sách lấy theo `danh_sach_ma_tthc` của chính lĩnh vực đó, tức
  cùng một nguồn với số đếm, nên hai con số không thể lệch nhau nữa. Đã đối chiếu
  toàn bộ 77 lĩnh vực: 0 trường hợp lệch.
- Trang chi tiết của bảy thủ tục nói trên trước đây bỏ trống mục "Lĩnh vực" và
  không có liên kết quay lại; nay hiển thị "Chưa phân loại" kèm liên kết.
- `scripts/trich-xuat-du-lieu.py` ghi thẳng tên nhóm vào bản ghi, để lần sinh dữ
  liệu sau không tái diễn tình trạng lệch này.

### Thay đổi

- Thẻ trạng thái "Đã công khai" chuyển sang xanh lá rõ ràng (`#1E7A46` trên nền
  `#E3F5EA`, kèm viền và chấm tròn) thay cho màu rêu nhạt khó nhận ra.
- Tô sáng từ khoá tìm kiếm chuyển sang vàng nổi bật (`#FFE566` viền `#F5C518`)
  thay cho màu đồng nhạt - dễ nhận ra phần khớp khi lướt danh sách dài.
- Trang `/in-ma-qr`: gộp ghi chú trước khi in vào vị trí đoạn mô tả, bổ sung số
  lượng mã QR vào chính ghi chú đó và gỡ đoạn mô tả cũ.

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
