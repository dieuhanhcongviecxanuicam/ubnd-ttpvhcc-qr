# Nhật ký thay đổi

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/).

## [1.13.2] - 2026-09-15

### Bảo mật

- **Đã áp dụng lớp chống bot và quét lỗ hổng lên Cloudflare, và đối chiếu trên
  site thật.** Chặn thẳng các đường dẫn mà site tĩnh không bao giờ có: 9/9 đường
  dẫn thử (`/wp-admin`, `/wp-login.php`, `/.env`, `/.git/config`, `/xmlrpc.php`,
  `/index.php`, `/phpmyadmin`, `/WP-ADMIN`, `/backup.sql`) nhận `403` từ
  Cloudflare, còn 9/9 trang thật (trang chủ, lĩnh vực, chi tiết, danh mục,
  `security.txt`, mã QR, hình minh hoạ, `robots.txt`, `sitemap.xml`) vẫn `200`.
  Cài đặt zone (HSTS, TLS ≥ 1.2, luôn HTTPS, Browser Integrity Check) đã đúng sẵn.

### Sửa lỗi

Ba lỗi trong `scripts/bao-ve-cloudflare.py` bản 1.13.0, **cả ba phát hiện nhờ đọc
trạng thái zone thật trước khi ghi, và sửa trước khi ghi lần nào**:

- **Script ghi đè luật của một hệ thống khác.** Zone `xanuicam.vn` dùng chung với
  nhiều subdomain và đã có sẵn luật của một ứng dụng khác, quản lý bởi
  `cloudflare-waf-apply.sh`. Bản cũ ghi bằng `PUT` cả bộ luật - tạo lại luật kia
  với ID mới, đủ làm hỏng script đang quản lý chúng theo ID. Nay script chỉ POST /
  PATCH / DELETE **từng luật** mang `ref` bắt đầu bằng `ubnd-ttpvhcc-qr-`; so khớp
  theo `ref` chứ không theo mô tả, vì mô tả chứa ngưỡng và đổi ngưỡng không được
  biến thành "xoá rồi tạo lại". Đã đối chiếu ID luật của hệ thống kia trước và sau
  khi áp dụng: giữ nguyên.

- **Luật "điểm đe doạ cao" sẽ không bao giờ khớp.** Nó dựa trên `cf.threat_score`,
  trường Cloudflare đã ngừng từ 30/09/2024 và nay luôn trả 0. Một luật chết trong
  tường lửa chỉ tạo cảm giác an toàn giả, nên đã gỡ. Trường thay thế
  (`cf.waf.score`) chỉ có từ gói Business.

- **Công tắc chống tấn công sẽ chặn cả hệ thống khác.** Bản cũ bật Under Attack
  Mode - một cài đặt TOÀN ZONE - nên sẽ dựng trang xác minh trước mặt mọi
  subdomain của `xanuicam.vn`. Nay công tắc là một luật WAF `managed_challenge`
  chỉ khớp host của site này, để sẵn ở trạng thái tắt. Nó còn hơn Under Attack
  Mode một điểm: luật bỏ qua bot tìm kiếm đứng trước, nên đang chống tấn công vẫn
  không rụng khỏi kết quả tìm kiếm. Công tắc nay chỉ cần quyền Zone WAF / Edit.

  **Đã thử thật:** bật thì mọi request nhận `403` kèm `cf-mitigated: challenge` và
  trang "Thực hiện xác minh bảo mật" tiếng Việt của Cloudflare; tắt thì hai lượt
  tải đầu vẫn gặp xác minh, từ giây thứ 15-20 mới trả `200` ổn định. Tổng thời gian
  bật trong hai lần thử là 31 giây. Độ trễ này nay được báo ngay trong thông điệp
  của script, để người trực không tưởng lệnh không ăn rồi bật/tắt lung tung.

### Không áp dụng được, ghi rõ lý do

- **Giới hạn tần suất nhường chỗ.** Gói Free chỉ cho một luật loại này, và chỗ đó
  đang giữ luật chống brute-force đăng nhập của hệ thống kia - quan trọng hơn nhiều
  so với giới hạn tần suất cho một trang tĩnh. Script tuyệt đối không gỡ luật của
  ai để lấy chỗ; gộp làm một cũng không được vì một luật chỉ có một ngưỡng. Luật
  của site này đã viết sẵn, tự áp dụng khi zone có thêm chỗ. Tham số cũng đã chỉnh
  cho hợp lệ trên gói Free: hành động xác minh bắt buộc `mitigation_timeout = 0`.
- **Bot Fight Mode chưa xác nhận được** - token dùng khi áp dụng không có quyền Bot
  Management. Cần bật tay tại Cloudflare > Security > Bots.

## [1.13.1] - 2026-09-15

### Sửa lỗi

- **Gói triển khai bị ném mất mọi tệp bắt đầu bằng dấu chấm, kể cả
  `/.well-known/security.txt` vừa thêm ở 1.13.0.** Tệp nằm đúng chỗ trong `out/`,
  build xanh, deploy xanh, không một cảnh báo nào - nhưng mở
  `https://ttpvhcc.xanuicam.vn/.well-known/security.txt` thì trả 404. Phát hiện
  bằng cách kiểm chứng trên site thật sau khi triển khai, không phải bằng CI.

  Nguyên nhân: `actions/upload-pages-artifact` đóng gói bằng `tar` kèm
  `--exclude=.[^/]*`, tức loại bỏ mọi mục bắt đầu bằng dấu chấm ở gốc thư mục
  xuất bản. Đã dựng lại đúng lệnh tar đó tại máy để xác nhận chứ không đoán:
  thư mục `.well-known/` biến mất, và **chính `.nojekyll`** mà bước ngay trước đó
  vừa tạo cũng bị ném đi cùng.

  Sửa bằng cách tự đóng gói artifact rồi đẩy qua `actions/upload-artifact`, giữ
  nguyên hợp đồng của Pages (một artifact tên `github-pages` chứa `artifact.tar`).

  Thêm hàng rào trong chính lượt triển khai: bước mới liệt kê nội dung gói và
  **chặn deploy** nếu thiếu `CNAME`, `.nojekyll`, `index.html` hoặc
  `.well-known/security.txt`. Lớp lỗi này không thể bắt bằng test trong kho mã -
  tệp có mặt ở mọi khâu trừ khâu cuối - nên chỗ duy nhất kiểm được là ngay trước
  khi gói rời runner.

## [1.13.0] - 2026-09-15

### Thay đổi

- **Đổi chữ mono từ IBM Plex Mono sang Chivo Mono: số 0 không còn dấu chấm ở
  giữa.** Mã thủ tục là thứ người dân đọc để đối chiếu với giấy tờ, mà "3.000442"
  hiện lên với ba cái chấm nằm trong ba số 0 trông như trang bị lỗi phông.

  Không sửa được bằng `font-feature-settings`. Đã soi trực tiếp bảng glyph của
  bản IBM Plex Mono đang dùng: glyph số 0 mặc định gồm **ba đường khép kín** -
  vành ngoài, vành trong và cái chấm. Đặc tính `zero` của font đổi sang số 0
  **gạch chéo** (cũng ba đường), còn `salt`/`ss04` trỏ tới glyph rỗng. Nghĩa là
  font này không có biến thể số 0 trơn để bật, phải đổi họ chữ.

  Đã soi glyph số 0 của **tám họ mono** khác trên Google Fonts - Roboto Mono,
  Noto Sans Mono, Source Code Pro, Red Hat Mono, DM Mono, Geist Mono, Reddit
  Mono, Overpass Mono - tất cả đều đánh dấu số 0 bằng chấm hoặc gạch. Đó là chủ
  ý của thể loại: chữ mono sinh ra cho người viết mã, nơi phân biệt 0 với O quan
  trọng hơn vẻ ngoài. Trên bảng niêm yết hành chính thì ưu tiên ngược lại.

  **Chivo Mono** là họ duy nhất trong nhóm khảo sát vừa có số 0 trơn (hai đường
  khép kín), vừa phủ trọn tiếng Việt (đủ U+1EA0-1EF9, đã đối chiếu bằng
  `scripts/kiem-tra-bo-chu.py`), vừa là **bộ chữ biến thiên** - nên một file phủ
  cả weight 500 lẫn 600, thay cho hai file tĩnh của Plex:

  | | Trước | Sau |
  |---|---|---|
  | Số file chữ mono | 2 | 1 |
  | Dung lượng | 32.892 B | 30.396 B |
  | Khai báo `@font-face` nhúng mỗi trang | 2 | 1 |

  Trợ năng giữ nguyên: `npm run kiem-tra-tro-nang` báo 0 vi phạm WCAG 2.1 AA sau
  khi đổi.

### Thêm mới

- **Lớp chống DDoS, bot và spam IP, viết thành mã trong `scripts/bao-ve-cloudflare.py`.**
  Site là tệp tĩnh trên GitHub Pages - không máy chủ ứng dụng, không cơ sở dữ
  liệu, nên mã nguồn trang không có chỗ nào để đếm hay chặn IP. Request bị chặn
  hay không đã được quyết định xong ở Cloudflare, trước khi tới máy chủ gốc. Đưa
  cấu hình đó vào kho mã để nó được rà soát và dựng lại được, thay vì nằm trong
  trí nhớ của người từng bấm dashboard.

  Bốn lớp thường trực, **người dân không thấy gì**:

  1. **Luật WAF** - bỏ qua bot tìm kiếm đã xác minh (đặt đầu tiên có chủ đích:
     chặn nhầm Googlebot là tự cắt đường người dân tìm thấy trang); **chặn** các
     đường dẫn quét lỗ hổng mà site tĩnh không bao giờ có (`/wp-admin`, `/.env`,
     `/.git`, `*.php`…); **bắt xác minh** khi điểm đe doạ cao - xác minh chứ
     không chặn thẳng, vì người dân dùng chung IP nhà mạng không được phép mất
     quyền tra cứu vì một máy khác cùng IP.
  2. **Giới hạn tần suất** - một IP vượt 60 request/10 giây thì phải qua xác minh
     trong 60 giây rồi tự trở lại bình thường. Ngưỡng đặt theo hành vi thật: một
     lượt mở trang chi tiết tải khoảng 10-14 tệp, nên người dân bấm nhanh liên
     tiếp vẫn cách ngưỡng rất xa. Không có danh sách đen nào để quên xoá.
  3. **Bot Fight Mode** - nhận diện bot giả mạo trình duyệt.
  4. **Cài đặt zone** - HSTS 1 năm + preload, TLS tối thiểu 1.2, luôn HTTPS,
     Browser Integrity Check.

  Mặc định script chỉ in ra dự định, phải thêm `--ap-dung` mới ghi; và chỉ ghi đè
  luật mang dấu `[ubnd-ttpvhcc-qr]`, luật ai đó đặt tay trên dashboard được giữ
  nguyên.

- **Công tắc "chế độ chống tấn công" (Under Attack Mode) - có, nhưng CỐ Ý KHÔNG
  bật thường trực.** Đây là trang xác minh vài giây kiểu grok.com. Trên trang
  dịch vụ công, cái giá của nó rơi đúng vào người dân: quét mã QR tại quầy phải
  chờ thêm mỗi lần mở trang, trên máy cũ bước xác minh có thể thất bại hẳn và họ
  mất luôn đường tra cứu, người dùng trình đọc màn hình gặp thêm rào cản trong
  khi dự án cam kết WCAG 2.1 AA, còn bot tìm kiếm thì bị chặn. Nội dung ở đây là
  thông tin bắt buộc phải niêm yết công khai - bắt người dân chứng minh mình
  không phải máy để đọc thông tin công khai là đặt sai ưu tiên.

  Nên nó là **công tắc sự cố**: bật bằng một lệnh khi đang bị tấn công thật, tắt
  ngay khi hết đợt.

- **Workflow `Chế độ chống tấn công`** (`workflow_dispatch`): bật/tắt và kiểm tra
  lớp bảo vệ **từ trình duyệt điện thoại**, vì khi site đang bị dội request thì
  người trực có thể chỉ có điện thoại trong tay. Hai thao tác có ảnh hưởng bắt gõ
  `DONG Y` để tránh bấm nhầm trong danh sách chọn. Dùng secret riêng
  `CLOUDFLARE_API_TOKEN_BAO_VE` chứ không dùng chung token xoá cache: token xoá
  cache chạy tự động mỗi lượt triển khai cạnh một job đang giữ `pages:write`,
  gộp quyền sửa tường lửa vào đó là cho lượt triển khai hằng ngày mang theo quyền
  nó không bao giờ dùng tới.

- **`public/.well-known/security.txt`** theo RFC 9116 - kênh báo lỗ hổng mà công
  cụ quét và người nghiên cứu bảo mật đọc trước khi tìm cách liên hệ.
  `tests/bao-mat.test.ts` canh trường `Expires`: đây là thứ duy nhất trong kho mã
  **tự hỏng theo thời gian** - quá hạn thì theo RFC tệp bị coi là hết hiệu lực,
  kênh báo lỗ hổng lặng lẽ biến mất trong khi trang vẫn chạy và CI vẫn xanh. Test
  bắt đầu báo đỏ trước 60 ngày.

- `docs/BAO-MAT.md` mục 9 và `docs/VAN-HANH.md` mục 8: cấu hình, cách kiểm chứng,
  và **giới hạn cần biết** - không có bảo mật tuyệt đối; địa chỉ gốc
  `*.github.io` vẫn đi thẳng không qua Cloudflare (đó là cách GitHub Pages hoạt
  động, không tắt được), nên rủi ro thật là lách lớp giới hạn tần suất chứ không
  phải lộ dữ liệu - hệ thống không có dữ liệu cá nhân nào để lộ.

### Thay đổi kỹ thuật

- Tách `scripts/cloudflare_chung.py` dùng chung cho hai script Cloudflare. Chép
  thay vì tách là chép luôn cơ hội sai lại: phần tra zone đã từng sai đúng một
  lần và làm job xoá cache trượt ngay lượt triển khai đầu tiên, vì tra theo tên
  miền đầy đủ trong khi zone là tên miền gốc.
- Sinh lại `inter-viet.woff2` và `lora-viet.woff2` từ bản thượng nguồn hiện tại
  (+80 B và +120 B) vì `scripts/tao-bo-chu.py` dựng lại cả ba họ trong một lần
  chạy.

## [1.12.1] - 2026-09-15

### Thay đổi

- **Tái cấu trúc vùng "Mã QR theo lĩnh vực" ở trang chủ theo mẫu bảng niêm yết
  giấy của đơn vị.** Bản cũ là 77 thẻ xám giống hệt nhau, mỗi thẻ chỉ có tên lĩnh
  vực, một mã QR 52 px và con số đếm. Người dân phải đọc từng chữ mới tìm được
  lĩnh vực cần, còn mã QR thì nhỏ tới mức phải mở trang lĩnh vực rồi mới quét
  được - tức là vùng này không làm được đúng việc mà tên nó hứa.

  Bản mới dựng lại theo đúng cấu trúc bảng niêm yết đang treo tại bộ phận một
  cửa (`docs/mau-tham-khao-ttpvhcc.png`): mỗi lĩnh vực là một thẻ có dải tiêu đề màu
  theo nhóm ngành, hình minh hoạ, mã QR 104 px quét được thẳng từ màn hình, ba
  thủ tục tiêu biểu và nút mở trang chi tiết. Thẻ gom theo 13 nhóm ngành, mỗi
  nhóm một khối có tiêu đề riêng.

  Ba quyết định đáng ghi lại:

  1. **Gom nhóm bằng bảng khai báo tay, không đoán theo từ khoá trong tên.**
     Đoán theo chuỗi sẽ xếp "An toàn đập, hồ chứa thuỷ điện" vào Điện lực thay vì
     Thuỷ lợi, và xếp "Đăng ký, quản lý cư trú" ra ngoài nhóm Hộ tịch - sai âm
     thầm, không ai phát hiện. Bảng tay sai thì test chặn ngay: `npm test` đối
     chiếu cả hai chiều, không lĩnh vực nào thiếu nhóm và không slug nào trong
     bảng trỏ tới lĩnh vực đã bị gỡ.
  2. **Màu nhóm khai báo trong `globals.css`, không nằm trong TypeScript.** Màu
     là chuyện trình bày; ngoài ra 77 thẻ mang `style=` nội tuyến sẽ phình HTML,
     mà trang này nhúng CSS thẳng vào HTML nên mỗi byte lặp lại ba lần trong
     payload. Toàn bộ 13 bộ màu đã tính tương phản trước khi chọn: thấp nhất là
     5,50:1 (chữ trắng trên nền cam Xây dựng), đều trên ngưỡng 4,5:1 của WCAG AA.
     Màu không bao giờ là dấu hiệu duy nhất - mỗi khối vẫn có tên nhóm bằng chữ.
  3. **Cắt tên thủ tục ở tầng dữ liệu (95 ký tự), không dùng
     `-webkit-line-clamp`.** Thuộc tính đó buộc phần tử về `display: -webkit-box`
     và hộp đó nuốt mất số thứ tự của thẻ `<li>`. Tên thủ tục dài nhất trong dữ
     liệu là 409 ký tự, gấp sáu lần tên trung vị (67) - để nguyên thì một thẻ cao
     gấp ba thẻ bên cạnh.

  Thêm hai bộ lọc độc lập: chip theo nhóm ngành và ô lọc theo tên (giữ nguyên
  cách so khớp bỏ dấu, gõ "giao duc mam" vẫn ra "Giáo dục mầm non"). Toàn bộ 77
  thẻ vẫn nằm sẵn trong HTML tĩnh, bộ lọc chỉ ẩn/hiện phía trình duyệt, nên
  người tắt JavaScript vẫn đọc và quét được đủ mã QR.

### Thêm mới

- **33 hình minh hoạ SVG tự vẽ trong `public/minh-hoa/`** - 13 hình cho 13 nhóm
  ngành và 20 hình riêng cho những lĩnh vực mà hình nhóm nói sai hẳn: "Biển và
  hải đảo" nằm chung nhóm Đất đai nên sẽ mang hình thửa ruộng, "Hàng hải và đường
  thuỷ nội địa" sẽ mang hình đường bộ. Bảng `HINH_RIENG` phủ 41 lĩnh vực, trong
  đó có hầu hết các lĩnh vực nhiều thủ tục nhất (Hộ tịch 38, Người có công 33,
  Hàng hải 21, Thuỷ lợi 17).

  Hình vẽ tay bằng SVG chứ không lấy từ kho ảnh: tệp nhỏ (25,6 KB cho cả 33 hình,
  10,6 KB sau brotli), không ràng buộc bản quyền, và nét vẽ đồng bộ với nhau. Nền
  để trong suốt, màu nền do chính thẻ tô - nhờ vậy một hình dùng lại được cho
  lĩnh vực ở nhóm khác mà không lạc màu.

- `src/lib/nhom-linh-vuc.ts`: bảng phân nhóm 77 lĩnh vực và bảng hình riêng.
- `rutGonTenTthc()` và `catNgan()` trong `src/lib/text.ts`, kèm test.
- Bốn bất biến mới trong `tests/du-lieu.test.ts`: mọi lĩnh vực có nhóm, bảng nhóm
  không còn slug mồ côi, mọi hình được tham chiếu đều tồn tại, và không có tệp
  hình nào không ai dùng.

### Hiệu năng

Đo bằng cách build lại đúng commit trước đó trong một worktree riêng rồi so từng
tệp, nên đây là số đối chứng chứ không phải ước lượng (kích thước brotli mức 11 -
đúng thứ Cloudflare phục vụ):

| Trang | Trước | Sau | Chênh |
|---|---|---|---|
| Trang chủ | 12,7 KB | 19,6 KB | +6,9 KB |
| Lĩnh vực | 9,8 KB | 10,7 KB | +0,9 KB |
| Chi tiết TTHC | 15,0 KB | 15,9 KB | +0,8 KB |
| Danh mục | 32,8 KB | 33,7 KB | +0,8 KB |

Trang chủ tăng 6,9 KB vì 77 thẻ nay mang thêm 157 tên thủ tục và cấu trúc thẻ đầy
đủ. Các trang còn lại tăng 0,8-0,9 KB vì phần CSS mới nằm trong `globals.css`, mà
`experimental.inlineCss` nhúng CSS vào mọi trang. Đây là cái giá đã biết trước của
lựa chọn nhúng CSS (xem `next.config.mjs`); đổi lại không có vòng tải CSS chặn
hiển thị. Hình minh hoạ tải lười, một lượt xem trang chủ chỉ tải vài hình đầu
tiên, mỗi hình 300-700 byte sau brotli.

Trợ năng giữ nguyên mức cam kết: `npm run kiem-tra-tro-nang` báo 0 vi phạm WCAG
2.1 AA trên cả 6 bố cục.

## [1.12.0] - 2026-09-15

### Bảo mật

- **Vá 3 lỗ hổng phụ thuộc npm, trong đó 1 mức critical.** Bước `npm audit
  --audit-level=high` trong CI chuyển sang đỏ dù không ai đụng vào mã nguồn - các
  advisory được công bố sau lần chạy CI gần nhất (27/08). Đây chính là việc mà
  bước audit sinh ra để làm: chặn trước khi lỗ hổng theo bản build lên production.

  | Gói | Từ | Lên | Mức |
  |---|---|---|---|
  | `next` | 16.3.2 | 16.3.5 | critical - RCE không cần xác thực (GHSA-p293-qw3h-jr36, GHSA-2xp9-vwfh-vxw4) |
  | `sharp` | 0.35.3 | 0.35.4 | high - lỗ hổng trong libheif (GHSA-rgj7-g3m4-5g8c) |
  | `js-yaml` | 4.3.1 | 4.3.2 | high - `maxTotalMergeKeys` không chặn được CPU (GHSA-2883-xcg3-v3hh) |

  Cả ba đều là bản vá trong khoảng semver đang khai báo, nên chỉ `package-lock.json`
  đổi, `package.json` giữ nguyên. Hai lỗ hổng của Next chỉ khai thác được trên máy
  chủ Windows và qua Image Optimization API - site này xuất tĩnh, không chạy máy chủ
  Next và đã tắt tối ưu ảnh, nên rủi ro thực tế với production bằng không; vá vì
  build và CI vẫn chạy gói đó, và vì không nên để CI đỏ thành chuyện bình thường.

  Đã đối chiếu sau khi nâng: 25 test, typecheck, lint, build 458 trang, CSP hợp lệ
  trên cả 458 trang, trợ năng 0 vi phạm WCAG 2.1 AA. `npm audit` báo 0 lỗ hổng.

## [1.11.3] - 2026-08-27

### Sửa lỗi

- **Gỡ 6.123 tệp rác (158 MB) đã lọt vào kho.** Trên WSL, Lighthouse dựng thư mục
  profile Chrome mang tên kiểu Windows (`C:\Users\...\lighthouse.NNNN`) **ngay
  trong thư mục đang chạy lệnh**, vì đường dẫn tạm kiểu Windows bị coi là tên tệp
  tương đối. Hai lần `git add -A` sau khi đo Lighthouse đã nuốt trọn chúng - 2.040
  tệp ở bản 1.10.1 và 4.083 tệp ở bản 1.11.2 - mà không ai để ý, vì phần diff của
  tệp tài liệu vẫn trông đúng.

  Sửa cả ba lớp, theo thứ tự quan trọng:
  1. **Gốc rễ:** lệnh Lighthouse trong `docs/HIEU-NANG.md` mục 6 nay ghim
     `--user-data-dir=/tmp/lighthouse-profile`.
  2. **Lưới an toàn:** `.gitignore` thêm mẫu `C:*`. Lưu ý mẫu `C:\*` **không có
     tác dụng** - trong `.gitignore` dấu `\` là ký tự thoát; đã kiểm bằng
     `git check-ignore` chứ không đoán.
  3. **Hàng rào CI:** bước mới chặn mọi đường dẫn chứa dấu `\` trong
     `git ls-files`. Đường dẫn hợp lệ của dự án không bao giờ chứa ký tự đó. Đã
     kiểm chứng bắt được lỗi thật.

  Lịch sử kho vẫn còn các tệp này nên `.git` đang ở mức 44 MB. Muốn xoá hẳn thì
  phải viết lại lịch sử và force-push vào `main` - **là thao tác phá huỷ trên
  nhánh được bảo vệ, cần đơn vị quyết định**, chưa làm.

### Thêm mới

- `docs/HIEU-NANG.md` mục 6: cách kiểm tra độ ổn định đường mạng **trước khi**
  đo hiệu năng. Dải TTFB của một tệp đã nằm trong cache biên rộng hơn 5-6 lần là
  dấu hiệu đừng đo. Ngày 26/08 dải đó là 0,28-5,02 giây và toàn bộ phép đo hôm
  ấy phải bỏ; ngày 27/08 là 0,20-0,62 giây và kết quả dùng được.

## [1.11.2] - 2026-08-27

### Thay đổi

- **Đo lại Lighthouse trên site thật sau khi bật cache biên**, 8 lượt mỗi trang,
  bỏ lượt đầu, trung vị 7 lượt. Cập nhật bảng điểm (mục 2) và Web Vitals (mục 3)
  của `docs/HIEU-NANG.md` sang ba mốc: gốc → nhúng CSS → tự host bộ chữ + cache
  biên.

  | Trang | Điểm | TBT |
  |---|---|---|
  | Chi tiết TTHC | 74 → 77 → **91** | 980 → 1060 → **379 ms** |
  | Trang chủ | 85 → 89 → **92** | 400 → 409 → **316 ms** |
  | Lĩnh vực | 87 → 94 → **95** | 380 → 285 → **247 ms** |

  Trang chi tiết - trang tụt hậu suốt từ đầu - **tăng 14 điểm**. FCP và LCP của
  cả ba trang nay đều quanh 1,2-1,8 giây.

### Ghi chú cho lần sau

- **Lần đo 26/08 không kết luận được, lần này thì có** - và lý do đáng nhớ. Hôm
  đó điểm dao động 67-89 trên cùng một trang trong cùng một phiên; nay dải chỉ
  còn 4-5 điểm ở hai trang. Hai thứ đã đổi: đường mạng của máy đo đã ổn định
  (TTFB của `/favicon.ico` từ dải 0,28-5,02 s xuống 0,20-0,62 s), và cache biên
  đã bật nên phương sai của máy chủ gốc không còn cộng vào từng lượt.
- Nghĩa là bật cache biên không chỉ làm trang nhanh hơn mà còn khiến hiệu năng
  **đo được**. Trước khi đo hiệu năng, hãy kiểm tra độ ổn định của đường mạng
  trước; nếu không thì mọi phép so sánh đều vô nghĩa.
- Trang lĩnh vực còn một lượt lạc ra 87 (sáu lượt kia 92-96). Trung vị 95 dùng
  được, nhưng đừng rút kết luận tinh tế từ trang này nếu không đo thêm.

## [1.11.1] - 2026-08-27

### Sửa lỗi

- **Job "Xoá cache Cloudflare" trượt ngay lượt triển khai đầu tiên.** Nó tra zone
  theo tên miền đầy đủ `ttpvhcc.xanuicam.vn`, trong khi zone của Cloudflare là
  tên miền **gốc** `xanuicam.vn`. Cùng một lỗi đã sửa trong
  `scripts/cau-hinh-cloudflare.py` nhưng workflow **viết lại logic đó bằng curl**
  nên không được sửa theo.

  Gốc rễ là việc nhân đôi logic, nên sửa bằng cách bỏ hẳn phần curl: workflow nay
  gọi `python3 scripts/cau-hinh-cloudflare.py --xoa-cache`. Script chỉ dùng thư
  viện chuẩn nên runner không phải cài gì. Phần tra zone giờ chỉ tồn tại ở một
  chỗ duy nhất.

### Thêm mới

- `scripts/cau-hinh-cloudflare.py` nhận thêm `--xoa-cache`.

## [1.11.0] - 2026-08-26

### Thêm mới

- `scripts/cau-hinh-cloudflare.py`: đặt Cache Rule qua API Cloudflare thay vì bấm
  tay trên dashboard. Hai luật **loại trừ nhau** nên không phụ thuộc thứ tự áp
  dụng: `/_next/static/*` cache một năm (tên file đã có băm nội dung), mọi đường
  dẫn còn lại cache ở biên một giờ với thời hạn phía trình duyệt giữ theo máy chủ
  gốc - cố ý, vì cache ở biên thì xoá được lúc triển khai còn cache trong máy
  người dân thì không. **Mặc định chỉ xem trước**, phải thêm `--ap-dung` mới ghi.
  Luật do người khác đặt tay được giữ nguyên; script chỉ quản lý luật có dấu
  `[ubnd-ttpvhcc-qr]`.
- Job **Xoá cache Cloudflare** trong `deploy.yml`: cache trang ở biên mà không
  xoá thì sau mỗi lần cập nhật, bản cũ còn được phục vụ tới hết Edge TTL. Job
  **tự bỏ qua khi chưa có secret** `CLOUDFLARE_API_TOKEN` nên thêm sẵn không làm
  hỏng lượt triển khai nào, và tự chạy kể từ lúc token được nạp.
- `docs/VAN-HANH.md` mục 7: quy trình ba bước để đơn vị bật cache - tạo token,
  áp Cache Rule, nạp secret.
- `docs/BAO-MAT.md`: bảng secret của kho mã kèm quyền tối thiểu. Token xoá cache
  chỉ cần Zone/Zone/Read và Zone/Cache Purge/Purge; token đặt Cache Rule cần thêm
  Cache Rules/Edit nhưng **chạy tay một lần và không nạp vào kho**. Workflow
  triển khai vốn đã giữ `pages:write` nên mọi quyền cộng thêm đều làm tăng thiệt
  hại nếu bị chiếm.

### Sửa lỗi

- **Cloudflare nay đã cache trang HTML.** Đã áp Cache Rule thật trên zone
  `xanuicam.vn` ngày 26/08/2026. `cf-cache-status` của mọi trang chuyển từ
  **DYNAMIC** sang **MISS rồi HIT**, tức yêu cầu dừng ở biên thay vì đi trọn một
  vòng tới GitHub Pages. TTFB trung vị 12 lượt còn **0,26-0,30 giây**.
- **File tĩnh hết bị cache ngắn.** `/_next/static/*` chuyển từ `max-age=14400`
  (GitHub Pages đặt cứng, không sửa được) sang `max-age=31536000`.
- Sửa `scripts/cau-hinh-cloudflare.py`: zone của Cloudflare là **tên miền gốc**
  (`xanuicam.vn`) chứ không phải subdomain site đang chạy (`ttpvhcc.xanuicam.vn`),
  nên phải duyệt danh sách zone rồi chọn hậu tố dài nhất. Bản đầu tra thẳng theo
  tên và không tìm thấy zone nào.
- Zone chưa có luật nào thì Cloudflare trả 404 cho phase cache - đó là trạng thái
  bình thường, nay không còn in ra như lỗi.

### Ghi chú cho lần sau

- Secret `CLOUDFLARE_API_TOKEN` đã nạp vào kho, và đã kiểm chứng cả vòng lặp:
  gọi `purge_everything` xong thì lượt kế tiếp trả `MISS`, lượt sau trả `HIT`.
- **Token đang dùng rộng hơn mức cần** (có cả Cache Rules/Edit vì dùng để áp
  luật). Nên thay bằng token chỉ có Zone/Zone/Read và Zone/Cache Purge/Purge rồi
  thu hồi token cũ - xem `docs/BAO-MAT.md`.

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
