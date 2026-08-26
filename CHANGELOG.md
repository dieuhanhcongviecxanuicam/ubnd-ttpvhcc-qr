# Nhật ký thay đổi

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/).

## [1.10.2] - 2026-08-26

### Thay đổi

- `docs/HIEU-NANG.md` mục 5.2: ghi nhận **Cloudflare không cache trang HTML**
  (`cf-cache-status: DYNAMIC` trên mọi trang), nên mỗi lần tải trang đều đi trọn
  một vòng tới máy chủ gốc GitHub Pages. Đây là lời giải cho triệu chứng "reload
  trang thì chậm": nhấn F5 luôn kiểm chứng lại tài liệu chính, bất kể
  `max-age=600`, và yêu cầu đó không dừng ở biên Cloudflare.

  Nguyên nhân: Cloudflare mặc định chỉ cache URL có **phần mở rộng tĩnh**. Dự án
  dùng `trailingSlash: false` nên đường dẫn trang không có phần mở rộng. Đối
  chiếu: `/favicon.ico`, `/robots.txt`, `/qr/*.png` đều nằm trong cache, còn mọi
  trang HTML cùng `/sitemap.xml`, `/manifest.webmanifest` thì không.

  Cách xử lý thuộc quyền đơn vị: thêm *Cache Rule* bật **Eligible for cache** cho
  đường dẫn trang, kèm xoá cache sau mỗi lần triển khai hoặc để Edge TTL ngắn.
  **Đừng đổi `trailingSlash` để lách** - quy ước URL đang nằm trong 78 mã QR đã in.

- Ghi rõ **chưa đo được mức thiệt hại**: lần rà này chạy từ máy có đường mạng
  đang hỏng, ngay cả `/favicon.ico` (2 KB, đã nằm trong cache Cloudflare) cũng
  cho TTFB dao động 0,28-5,02 giây. Kết luận rút ra từ **header phản hồi**, thứ
  không phụ thuộc tốc độ mạng; muốn có con số phải đo lại từ đường mạng ổn định.

## [1.10.1] - 2026-08-26

### Thay đổi

- `docs/HIEU-NANG.md`: đo lại trên site thật sau khi đổi bộ chữ. **TBT giảm mạnh
  và ổn định**: chi tiết TTHC 1060 -> ~360 ms (-66%), trang chủ 409 -> ~345 ms,
  lĩnh vực 285 -> ~225 ms.
- **FCP, LCP và điểm tổng thì không kết luận được** và đã ghi thẳng như vậy thay
  vì chọn con số đẹp: cùng một trang trong cùng một phiên, điểm dao động 67-89 và
  FCP dao động 1,6-4,2 giây. Bảng điểm mục 2 và Web Vitals mục 3 **giữ nguyên số
  cũ**; chỉ TBT là có căn cứ để cập nhật.
- Ghi lại hai mức cắt bộ chữ sâu hơn đã cân nhắc và **loại**: bỏ các khối Latin
  hiếm chỉ được 12,7 KB; cắt sát xuống 593 ký tự được 40 KB nhưng khiến CI chặn
  deploy mỗi khi Excel mới có ký tự lạ - quá đắt so với hậu quả thật là một ký tự
  hiện bằng chữ hệ thống.

## [1.10.0] - 2026-08-26

### Thay đổi

- **Bộ chữ chuyển sang tự host, mỗi họ một file** (`next/font/google` ->
  `next/font/local`). `next/font/google` cũng tự host lúc build, nhưng giữ nguyên
  cách Google cắt bộ chữ theo `unicode-range`: dấu tiếng Việt nằm ở file khác với
  chữ cái không dấu, nên chữ "Giải" phải tạo hình bằng **hai file font**.

  Đo A/B hai bản build, xen kẽ và xoay vòng thứ tự trong cùng phiên, CPU 6x,
  khổ 390px, trung vị 9-11 lượt - **Style & Layout giảm gần một nửa trên mọi loại
  trang**: chi tiết TTHC 637 -> 290 ms (**-54,5%**), lĩnh vực -51,8%, trang chủ
  -48,7%, danh mục -43,2%.

  Tải về và kích thước trang giảm theo: woff2 từ **12 file / 251,0 KB xuống
  4 file / 184,5 KB**; khai báo `@font-face` mỗi trang từ **62 (21,9 KB) xuống
  7 (1,1 KB)**; HTML thô mỗi trang **198,6 -> 135,7 KB**; tổng HTML 458 trang
  **74,8 -> 46,7 MB**.

  Chỗ được nhiều nhất không phải bộ chữ mà là **CSS**: 44 trong 62 khai báo
  `@font-face` là dải unicode không trang nào dùng, mà CSS lại nhúng ba lần vào
  mỗi trang.

  Hình thức: đã chụp đối chiếu ở khổ điện thoại, hai bản **không phân biệt được
  bằng mắt**. Chữ Việt đậm rộng thêm 1-5% (bản mới đạt weight 600 thật, bản cũ
  không - xem 1.9.3) nhưng không đủ để đổi ngắt dòng.
- Bỏ weight Lora 500: đối chiếu `document.fonts` trên cả sáu loại trang cho thấy
  không trang nào dùng. Inter 500 thì **có** dùng (trang danh mục và lĩnh vực),
  nên giữ.

### Thêm mới

- `scripts/tao-bo-chu.py`: tải bản gốc từ kho `google/fonts`, ghim trục không
  dùng, giới hạn `wght` về đúng khoảng cần, subset xuống ba dải unicode thực
  dùng. Kết quả commit vào `src/fonts/` nên build và CI không cần mạng - cùng lối
  với `scripts/tao-bo-nhan-dien.py`.
- `scripts/kiem-tra-bo-chu.py` chạy trong CI: đối chiếu bộ chữ với **mọi ký tự
  thực sự có trong `data/`**. Không có nó, lần cập nhật Excel sau đưa vào một ký
  tự nằm ngoài phần đã cắt thì trình duyệt lặng lẽ rơi về chữ hệ thống cho riêng
  ký tự đó - trang vẫn hiện, build vẫn xanh, test vẫn qua. Đã kiểm chứng bắt được
  lỗi thật.
- Bổ sung dải dấu tổ hợp `U+300-36F`. Bản Google Fonts chỉ có lác đác vài dấu nên
  chữ Việt dạng **phân tách** ("ê" viết thành e + U+0302) không hiện đúng; dữ
  liệu nguồn của đơn vị có lẫn dạng này.
- `CONTRIBUTING.md` mục **Bộ chữ tự host**, kèm cảnh báo đừng quay lại
  `next/font/google`.

## [1.9.3] - 2026-08-26

### Thay đổi

- `docs/HIEU-NANG.md`: **dựng thử và đo bản Inter gộp một face**, thay vì dừng ở
  đề xuất. Bản gộp (subset từ Inter variable gốc, ghim `opsz`, giới hạn `wght`
  400-700, ba dải unicode thực dùng) đưa Inter từ **140,6 KB / 9 file xuống
  99,6 KB / 1 file**, phủ đủ chữ tiếng Việt.
- Nhưng win dàn trang chỉ **khoảng -10%** chứ không phải -42%: ba lần chạy độc
  lập cho -20,9% / -12,1% / -8,3%, lần đầu đo lúc máy nhiễu nên bỏ. Con số -42,6%
  của phép chẩn đoán trước bao gồm cả việc bỏ hẳn webfont, không chỉ gộp face.

### Ghi chú cho lần sau

- **Đã dừng theo tiêu chí đặt trước** (bề rộng chữ lệch quá 0,5px). Weight 400
  khớp trong 0-5px; weight 600/700 lệch tới 25px. Đã loại trừ ba nguyên nhân sai
  (subset đánh rơi dữ liệu, cách khai `@font-face`, kern) trước khi kết luận.
- Nguyên nhân thật: bản hiện tại **không đạt weight 600 thật cho chữ tiếng Việt**
  (glyph `ạ` đo được 560/570/580 ở weight 400/600/700, đáng lẽ 560/580/580), do
  `next/font` khai ba `@font-face` weight rời cùng trỏ một file variable. Bản gộp
  render đúng hơn nhưng chữ Việt đậm rộng thêm 1-5% - **thay đổi hình thức, thuộc
  thẩm quyền đơn vị**.
- Nếu làm tiếp, luận điểm mạnh là **-41 KB và 8 request** (~200 ms trên mạng
  1,6 Mbps), không phải -10% dàn trang.

## [1.9.2] - 2026-08-26

### Thay đổi

- `docs/HIEU-NANG.md` mục 4: tìm ra **nguyên nhân gốc** của nút thắt dàn trang ở
  trang chi tiết. Bảng cũ chỉ nói chi phí nằm ở Style & Layout; nay đã bóc được
  vì sao. Thủ phạm là **Inter, bộ chữ nội dung**: thay riêng nó về chữ hệ thống
  cắt 42,6% Style & Layout, trong khi Lora chỉ 2,2% và IBM Plex Mono 8,4%.
  Gốc rễ là cách Google Fonts cắt bộ chữ theo `unicode-range`: dấu tiếng Việt
  nằm ở file khác với chữ cái không dấu, nên chữ "Giải" phải tạo hình bằng hai
  file font, và cả trang 18.600 ký tự bị xé thành vô số đoạn nhỏ. Đo trên trang
  cô lập: với Inter chia ba face, chữ có dấu đắt hơn chữ bỏ dấu **49,6%**; với
  DejaVu Sans một face phủ trọn, chỉ **17,9%**. Tức chi phí đặt dấu vốn có chỉ
  ~18%, hơn 30 điểm còn lại là cái giá của việc xé đoạn.
- Ghi lại **tám hướng đã đo và loại** kèm số, trong đó có giả thuyết lưới
  `minmax(0, 1fr)` (-1,4%, bị bác bỏ) và ba hướng chỉ được ~8% nhưng phải đổi
  chất lượng chữ hoặc thiết kế.
- Ghi lại **bốn cái bẫy đo đạc** đã dính lần này, cả bốn đều cho số trông thuyết
  phục mà sai: thứ tự chạy cố định làm bản đứng cuối chịu thiệt (một bản ít nội
  dung hơn đo ra tốn thêm 17,6%); sửa CSS trong payload RSC phá băm CSP khiến
  trang không hydrate; sửa nội dung làm trang dựng hỏng rồi đo nhầm trang gần
  trống (345 nút còn 25); và nới lỏng chốt kiểm tra sau khi nó báo nhầm.

### Ghi chú cho lần sau

- Hướng duy nhất còn biên độ lớn: **phục vụ Inter thành một face phủ cả latin
  lẫn tiếng Việt** thay vì ba face chia theo `unicode-range`. **Chưa chứng minh
  được**: bản thử gộp bằng `fontTools.merge` đo ra -42,9% nhưng bộ chữ gộp hụt
  bề rộng tới 22px ở mẫu nhiều dấu do đánh rơi GPOS, nên số đó đã bị loại. Muốn
  đi tiếp phải subset từ Inter gốc bằng `pyftsubset` rồi đối chiếu bề rộng chữ
  trước, và cân thêm đánh đổi byte trên mạng di động.
- Bộ đo dùng CDP `Performance.getMetrics` (`LayoutDuration` + `RecalcStyleDuration`)
  nhạy hơn TBT của Lighthouse nhiều. Mọi bản đo phải kèm chứng cứ trang vẫn dựng
  đúng: số nút DOM và thời lượng script nằm trong ngưỡng của bản gốc.

## [1.9.1] - 2026-08-26

### Sửa lỗi

- **`package.json` đứng yên ở `1.0.0` suốt chín bản phát hành** trong khi nhật ký
  này đã ở 1.9.0. Nay đồng bộ, và có bước CI đối chiếu để không trôi lại.

### Thêm mới

- `scripts/kiem-tra-phien-ban.mjs`: đối chiếu `version` trong `package.json` với
  mục phát hành mới nhất của `CHANGELOG.md`, chạy trong job "Typecheck, lint,
  test, build". Cùng lớp lỗi với việc bảy pull request (#11-#17) quên ghi nhật
  ký: quy trình chỉ nằm trong trí nhớ thì sớm muộn cũng trôi.
- `CONTRIBUTING.md` mục **Nhật ký thay đổi và phiên bản**. Tài liệu đóng góp
  trước đây **không hề nhắc** tới `CHANGELOG.md` - đó chính là gốc rễ của việc
  bảy pull request liên tiếp quên cập nhật nó.

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
