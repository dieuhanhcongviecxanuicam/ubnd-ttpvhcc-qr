# Hiệu năng - số liệu cơ sở

Tài liệu này ghi lại kết quả đo Lighthouse lần đầu, để các lần thay đổi sau có
mốc mà đối chiếu. **Chưa tối ưu gì cả** - đây là hiện trạng, không phải mục tiêu.

## 1. Điều kiện đo

| Hạng mục | Giá trị |
|---|---|
| Ngày đo | 25/08/2026 (trước) và 26/08/2026 (sau khi tối ưu) |
| Công cụ | Lighthouse 12.8.2 |
| Trình duyệt | Chrome for Testing 151.0.7922.34, chế độ headless |
| Thiết bị mô phỏng | **Mobile** (điện thoại) |
| Điều tiết mạng | `devtools` (mặc định của Lighthouse) |
| Đối tượng đo | Trang thật <https://ttpvhcc.xanuicam.vn>, đi qua Cloudflare |

Đo trên **mobile** chứ không phải desktop, vì người dùng đến với site này chủ yếu
bằng cách quét mã QR bằng điện thoại ngay tại quầy.

Không đo bằng `python -m http.server` tại máy: kết quả sẽ sai lệch vì thiếu tầng
nén, cache và định tuyến URL của GitHub Pages với Cloudflare.

Mục 2 và 3 ghi số liệu **trước và sau** lần tối ưu ở mục 4. Mỗi con số "sau" là
trung vị của 3 lần đo trên trang thật.

> Đo ngay sau khi triển khai sẽ ra số xấu giả: lần đo đầu tiên gặp cache
> Cloudflare còn nguội (trang chi tiết ra 68 điểm, FCP 2,6 s), ba lần sau ổn
> định ở 77 điểm và FCP 1,3 s. Luôn đo lặp và bỏ lần đầu.

## 2. Điểm số

| Trang | Hiệu năng | Trợ năng | Thực hành tốt | SEO |
|---|---|---|---|---|
| Trang chủ `/` | 85 → **89** | **100** | **100** | 92 |
| Lĩnh vực `/linh-vuc/ho-tich` | 87 → **94** | **100** | **100** | 92 |
| Chi tiết `/tthc/1.000110` | 74 → **77** | **100** | **100** | 92 |

Trợ năng đạt 100/100 trên cả ba trang, khớp với kết quả 0 vi phạm WCAG 2.1 AA
của bộ test axe-core trong `tests/`.

## 3. Chỉ số Web Vitals

| Trang | FCP | LCP | TBT |
|---|---|---|---|
| Trang chủ | 2,4 s → **1,3 s** (-46%) | 2,4 s → **1,3 s** (-46%) | 400 → 409 ms |
| Lĩnh vực | 2,3 s → **1,2 s** (-48%) | 2,3 s → **1,8 s** (-22%) | 380 → **285 ms** (-25%) |
| Chi tiết TTHC | 2,3 s → **1,3 s** (-42%) | 2,3 s → **1,3 s** (-42%) | 980 → 1060 ms (+8%) |

LCP dưới 2,5 s ở cả ba trang - đạt ngưỡng "tốt" của Core Web Vitals, và sau khi
tối ưu thì còn rộng hơn nhiều.

TBT của trang chi tiết nhích lên 8%: đó là cái giá đã biết trước của việc nhúng
CSS, vì trình duyệt phải phân tích thêm phần HTML phình ra. Đổi lại LCP - chỉ số
Core Web Vitals quan trọng nhất - giảm 42%. Đánh đổi có lợi.

Điểm hiệu năng của trang chi tiết thấp hơn hẳn (74). Bảng đo đầu tiên quy
nguyên nhân cho TBT 980 ms, tức JavaScript. **Đó là quy kết sai**, đã đo lại
và đính chính ở mục 4.

## 4. Nút thắt thật của trang chi tiết

Bóc tách luồng chính của hai trang:

| | Trang chi tiết | Trang lĩnh vực |
|---|---|---|
| Script Evaluation | 623 ms | **676 ms** |
| **Style & Layout** | **1038 ms** | **354 ms** |

Script Evaluation của trang chi tiết còn **thấp hơn** trang lĩnh vực - hai trang
tải cùng bộ JavaScript. Chênh lệch nằm trọn ở **dàn trang**. Năm trong sáu long
task dài nhất được quy cho chính tài liệu HTML chứ không phải file JS, trong khi
scripting của tài liệu chỉ 13 ms.

Nút thắt là bố cục cho khối lượng văn bản lớn: HTML trang chi tiết nặng 93 KB so
với 42 KB của trang lĩnh vực, dù số phần tử DOM gần bằng nhau (295 vs 275).

### Bốn hướng đã thử

Đo A/B tại máy: CPU throttle 6x, mạng 1.6 Mbps / 170 ms, mỗi bản 7-9 lần, lấy
trung vị, các bản đo **xen kẽ trong cùng phiên** để triệt nhiễu.

| Hướng | Kết quả | Quyết định |
|---|---|---|
| `content-visibility: auto` | -52% layout, -28% tổng | **Loại** - phá trợ năng |
| `contain: layout style paint` | +2%, trong nhiễu | Loại |
| `font-display: optional` | không đo được lợi ích | Loại |
| `experimental.inlineCss` | **FCP và LCP đều -61%** | **Đã áp dụng** |

Số -61% là đo tại máy. Trên trang thật, mức cải thiện là **-42% đến -48% FCP** và
**-22% đến -46% LCP** tuỳ trang (xem mục 2 và 3).

**Đừng thử lại `content-visibility`.** Nó nhanh nhất nhưng loại nội dung ngoài
tầm nhìn khỏi cây trợ năng: 746 nút tụt còn 200, mất hẳn bốn tiêu đề mục (Cách
thức thực hiện, Thành phần hồ sơ, Kết quả thực hiện, Căn cứ pháp lý), và **cuộn
hết trang cũng không khôi phục**. Người dùng trình đọc màn hình sẽ mất bốn mục
nội dung chính.

`contain` và `font-display: optional` thoạt đo có vẻ tốt (-16% và -40%) nhưng
chạy lại nhiều lần thì rơi vào nhiễu. Ghi lại để khỏi mất công thử lại.

### Đã áp dụng: nhúng CSS vào HTML

`experimental.inlineCss` trong `next.config.mjs`. File CSS chặn hiển thị; nhúng
thẳng vào HTML bỏ được một vòng yêu cầu.

Chi phí: Next nhúng CSS ba lần (một trong `<style>`, hai lần trong payload RSC)
nên HTML thô phình 93 -> 211 KB. Nhưng Cloudflare phục vụ bằng **brotli**, khử
trùng lặp gần hết:

| | Lượt đầu | Trang thứ hai trong phiên |
|---|---|---|
| Trước | 16,5 KB | 10,7 KB |
| Sau | 16,6 KB | 16,6 KB |

Lượt đầu gần như miễn phí - đúng kịch bản chính của site. Người xem nhiều trang
liên tiếp tốn thêm ~5,9 KB mỗi trang vì CSS không còn cache dùng chung.

### Đào sâu: vì sao dàn chữ Việt đắt đến vậy

Bảng trên mới nói *chỗ nào* tốn, chưa nói *vì sao*. Lần đo này bóc tiếp, bằng bộ
đo nhạy hơn Lighthouse: đọc thẳng `LayoutDuration` + `RecalcStyleDuration` qua
CDP `Performance.getMetrics`. Đó là bộ đếm tích luỹ của chính trình duyệt chứ
không phải suy ra từ long task, nên phương sai thấp hơn hẳn. Điều kiện: CPU
throttle 6x, khổ 390px, mỗi bản 9-11 lượt **xen kẽ và xoay vòng thứ tự**, lấy
trung vị.

Bộ đo tái hiện đúng chênh lệch đã ghi ở trên (chi tiết 640 ms so với lĩnh vực
262 ms) và làm rõ thêm: **585 ms trong đó là `layout` thuần, `style recalc` chỉ
47 ms** - thấp hơn cả trang chủ. Không phải chuyện chọn selector hay số quy tắc
CSS.

Thay từng họ chữ về chữ hệ thống, giữ nguyên mọi thứ khác:

| Đổi | S&L | Kết luận |
|---|---|---|
| **Inter (chữ nội dung) -> hệ thống** | **-42,6%** | thủ phạm |
| Lora (tiêu đề) -> hệ thống | -2,2% | không đáng kể |
| IBM Plex Mono -> hệ thống | -8,4% | ít |

Dải đo tách bạch hẳn, không chồng lấn (612-685 ms so với 347-383 ms).

Nguyên nhân gốc nằm ở cách Google Fonts cắt bộ chữ. Mỗi họ/weight bị chia thành
ba `@font-face` theo `unicode-range`, và **dấu tiếng Việt nằm ở file khác với
chữ cái không dấu**: file tiếng Việt chứa 90 ký tự có dấu nhưng chỉ 1 chữ cái
latin, file latin chứa 58 chữ cái nhưng 0 ký tự tiếng Việt. Nghĩa là chữ "Giải"
phải tạo hình bằng **hai file font khác nhau**, và cả trang 18.600 ký tự bị xé
thành vô số đoạn nhỏ. Trang chi tiết khai 186 `@font-face`, tải về 12 file woff2.

Đo tách bạch trên trang cô lập - chỉ có chữ và font, không React, không CSP, số
nút DOM giống hệt nhau:

| Bộ chữ | Có dấu đắt hơn bỏ dấu |
|---|---|
| Inter (3 face chia theo dải unicode) | **+49,6%** |
| DejaVu Sans (1 face phủ trọn) | **+17,9%** |

Chi phí đặt dấu **vốn có** chỉ khoảng 18%. Hơn 30 điểm chênh còn lại là cái giá
của việc xé đoạn qua nhiều file. Đây là thứ sửa được, và là hướng duy nhất còn
lại có biên độ lớn: **phục vụ Inter thành một face duy nhất phủ cả latin lẫn
tiếng Việt** (tự host qua `next/font/local` với bản subset gộp sẵn) thay vì ba
face chia theo `unicode-range`.

**Chưa làm, vì chưa chứng minh được bằng bản trung thực.** Bản thử gộp bằng
`fontTools.merge` đo ra -42,9% nhưng bộ chữ gộp **không trung thực về metric**:
bề rộng chữ hụt tới 22px ở mẫu nhiều dấu, do quá trình gộp đánh rơi dữ liệu
GPOS. Số đó đã bị loại, không dùng làm căn cứ. Muốn đi tiếp phải subset từ bản
Inter gốc bằng `pyftsubset` (giữ nguyên GPOS) rồi đối chiếu lại bề rộng chữ
trước khi tin bất kỳ con số nào. Cần cân thêm đánh đổi byte: gộp file có thể
làm tăng dung lượng tải, mà người dùng chính của site ở mạng di động.

### Đã dựng thử bản gộp một face - kết quả và lý do dừng

Hướng nêu trên **đã được dựng thật và đo**, không dừng ở giả thuyết. Quy trình:
tải bản Inter variable gốc từ kho `google/fonts`, ghim trục `opsz`, giới hạn
`wght` về 400-700, rồi `pyftsubset` xuống đúng hợp của **ba dải unicode mà trình
duyệt thực sự tải** (không phải 21 dải `next/font` khai).

Phần được:

| | Hiện tại | Bản gộp |
|---|---|---|
| Dung lượng Inter | 140,6 KB | **99,6 KB** |
| Số file | 9 | **1** |
| Phủ ký tự tiếng Việt | đủ | đủ (0 ký tự thiếu) |

Phần hụt so với kỳ vọng: **win chỉ khoảng -10%**, không phải -42%. Ba lần chạy
độc lập trên trang chi tiết đầy đủ (React và CSP nguyên vẹn, số nút DOM 348 ở cả
hai bản): **-20,9%**, **-12,1%**, **-8,3%**. Lần đầu đo lúc máy đang nhiễu (gốc
940 ms so với ~640 ms các lần sau) nên phải bỏ. Con số -42,6% của phép chẩn đoán
"Inter -> chữ hệ thống" bao gồm cả việc **bỏ hẳn webfont** (không còn dàn lại khi
font về, và DejaVu vốn rẻ hơn Inter); gộp face chỉ lấy lại được phần xé đoạn.

**Đã dừng lại theo tiêu chí đặt trước: bề rộng chữ lệch quá 0,5px.** Weight 400 -
phần gánh gần hết chữ trên trang - khớp trong vòng 0-5px. Nhưng weight 600 và 700
lệch tới 25px trên chuỗi nhiều dấu. Đã truy đến cùng nguyên nhân, loại trừ được
ba giả thuyết sai:

- **Không phải** do subset đánh rơi dữ liệu: bản subset từ TTF tĩnh và bản subset
  từ variable cho ra số **giống hệt nhau**.
- **Không phải** do cách khai `@font-face`: khai một `font-weight: 400 700` hay
  ba khai báo weight rời đều cho cùng kết quả.
- **Không phải** do kern: tắt `font-kerning` ở cả hai bản, chênh lệch giữ nguyên.

Nguyên nhân thật: đo bề rộng một glyph ở 100px cho thấy `ạ` của bản hiện tại là
**560 / 570 / 580** ở weight 400 / 600 / 700, còn bản gộp là **560 / 580 / 580**.
Tức bản hiện tại **không đạt tới weight 600 thật** cho chữ tiếng Việt, dù chữ
latin bên cạnh vẫn đậm đúng. `next/font` khai ba `@font-face` weight rời cùng trỏ
**một file variable duy nhất** (trục `wght` 100-900, mặc định 400), và Chromium
xử lý trường hợp đó không ra đúng 600.

Nghĩa là bản gộp render **đúng hơn**, nhưng khác đi trông thấy: chữ Việt đậm rộng
thêm khoảng 1-5%. Đó là thay đổi hình thức trên site thật, thuộc thẩm quyền đơn
vị chứ không phải quyết định kỹ thuật thuần tuý.

**Nếu đơn vị đồng ý đánh đổi**, luận điểm mạnh nhất không phải -10% dàn trang mà
là **-41 KB và 8 request** - trên mạng 1,6 Mbps thì 41 KB xấp xỉ 200 ms, đáng giá
hơn với người quét mã QR bằng điện thoại tại quầy. Việc cần làm: chuyển chữ nội
dung sang `next/font/local`, commit file woff2 đã subset, và thêm script bảo trì
sinh lại nó (cần `fonttools`, tương tự `scripts/tao-bo-nhan-dien.py`).

### Bảy hướng đã đo và loại

| Hướng | S&L | Vì sao loại |
|---|---|---|
| `grid-template-columns: minmax(0, 1fr)` | -1,4% | Nghi lưới phải tính min-content của cả cột chữ. Không phải. |
| `white-space: normal` thay `pre-line` | -1,4% | Trong nhiễu |
| `text-rendering: optimizeSpeed` | -1,7% | Trong nhiễu |
| `font-variant-ligatures: none` | -1,5% | Trong nhiễu |
| `font-optical-sizing: none` | +1,5% | Không có tác dụng |
| `font-kerning` + ligature cùng tắt | -8,5% | Đổi chất lượng chữ lấy 8%, không đáng trên trang toàn chữ |
| Gộp weight đang dùng còn 400+600 | -8,2% | Phải đổi thiết kế (700 -> 600) để lấy 8% |
| `font-display: optional` | -8,5% | Nhiều người dùng di động sẽ không bao giờ thấy Inter |

Đáng chú ý: giảm số instance của Inter chỉ được -8%, tức chi phí **không** nằm ở
số weight đang dùng. Nó nằm ở chính việc tạo hình chữ Việt trên bộ chữ bị chia
nhỏ.

### Bốn cái bẫy đã dính khi đo lần này

Ghi lại đủ để lần sau khỏi mất công dính lại - cả bốn đều cho ra số **trông rất
thuyết phục** mà sai.

1. **Chạy các bản theo thứ tự cố định.** Bản đứng cuối mỗi vòng chịu thiệt có hệ
   thống. Triệu chứng: một bản *ít nội dung hơn* đo ra tốn thêm 17,6%, tái lập
   qua cả ba lần chạy. Phải **xoay vòng thứ tự** mỗi lượt, xen kẽ thôi chưa đủ.
2. **Sửa CSS bên trong payload RSC.** CSS được nhúng ba lần: một trong `<style>`
   và hai trong payload RSC, mà payload nằm trong thẻ `<script>` đã được băm
   sha256 vào CSP. Đụng vào là script bị chặn, trang không hydrate. Triệu chứng:
   `script` tụt từ 574 ms còn 17 ms. Chỉ được sửa trong khối `<style>`.
3. **Sửa nội dung làm trang dựng hỏng.** Bản thử bỏ dấu toàn văn bản đo ra -49,9%
   rất đẹp, nhưng số nút DOM tụt từ 345 còn **25** - đang đo một trang gần trống,
   đúng cái bẫy `npx serve out` ở mục 6, chỉ khác đường vào.
4. **Nới lỏng chốt kiểm tra sau khi nó báo nhầm.** Số nút dao động vài đơn vị
   giữa các lượt nên chốt "số nút phải bằng nhau" báo nhầm; bỏ nó đi thì đúng
   lượt sau dính bẫy số 3. Cách đúng là để dung sai 10%, và canh **cả hai** tín
   hiệu: thời lượng script và số nút DOM.

Bài học chung: mọi bản đo phải kèm chứng cứ rằng **trang vẫn dựng đúng** - số nút
DOM và thời lượng script nằm trong ngưỡng của bản gốc. Số đo của một trang hỏng
luôn đẹp hơn số đo của trang thật.

## 5. Hai vấn đề nằm ngoài kho mã

Cả hai đều thuộc cấu hình Cloudflare/GitHub Pages, **không sửa được bằng cách
đổi mã nguồn**. Ghi lại để đơn vị quyết định.

### 5.1. SEO bị giữ ở 92 vì `robots.txt`

Lighthouse báo `robots.txt is not valid - 1 error found`, tại dòng 30:

```
Content-Signal: search=yes,ai-train=no,use=reference    -> Unknown directive
```

Dòng này **không phải của dự án**. Cloudflare tự chèn thêm khối "Cloudflare
Managed Content" vào đầu `robots.txt`, gồm chính sách Content Signals và danh
sách chặn các trình thu thập AI (`GPTBot`, `meta-externalagent`, …). Phần
`robots.txt` do dự án sinh ra vẫn còn nguyên vẹn ở cuối file.

`Content-Signal` là chuẩn mới, Lighthouse chưa nhận diện nên báo là chỉ thị lạ.
Các trình thu thập đúng chuẩn đều bỏ qua chỉ thị chúng không hiểu, nên **thực tế
không gây hại gì** - chỉ làm xấu điểm SEO của Lighthouse.

Muốn được 100 SEO thì phải tắt tính năng quản lý `robots.txt` của Cloudflare,
đổi lại mất phần chặn thu thập AI. Đây là đánh đổi thuộc thẩm quyền của đơn vị.

### 5.2. Thời hạn cache quá ngắn cho file có băm nội dung

```
$ curl -sI https://ttpvhcc.xanuicam.vn/_next/static/chunks/3s6nzrbk-8mnv.js
cache-control: max-age=14400
```

Các file trong `/_next/static/` đã có **băm nội dung trong tên file** - nội dung
đổi thì tên đổi theo, nên chúng bất biến và đáng lẽ phải cache một năm. GitHub
Pages đặt cứng 4 giờ và không cho tuỳ chỉnh header.

Lighthouse ước tính sửa được sẽ tiết kiệm khoảng 300 KiB mỗi lượt truy cập lại.

Cách xử lý: thêm một **Cache Rule** trên Cloudflare cho đường dẫn khớp
`/_next/static/*`, đặt `Cache-Control: public, max-age=31536000, immutable`.

> **Cảnh báo:** chỉ thêm *Cache Rule*. **Không** động vào phần header
> `Content-Security-Policy` tại Cloudflare - xem `docs/BAO-MAT.md`, mở rộng CSP ở
> tầng Cloudflare sẽ chặn chính script của trang.

## 6. Đo lại

```bash
# Cần Chrome/Chromium. Nếu dùng bản của Playwright mà báo thiếu libasound.so.2:
#   apt-get download libasound2t64 && dpkg-deb -x libasound2t64_*.deb ./libs
#   export LD_LIBRARY_PATH=$PWD/libs/usr/lib/x86_64-linux-gnu

npx lighthouse https://ttpvhcc.xanuicam.vn/ \
  --preset=perf \
  --only-categories=performance,accessibility,best-practices,seo \
  --chrome-flags="--headless=new --no-sandbox --disable-dev-shm-usage"
```

Đo trang thật, không đo bản build tại máy.

### Bẫy khi muốn đo bản build cục bộ

`npx serve out` **đo nhầm trang**. Với đường dẫn `/tthc/1.000110`, thư mục
`out/tthc/1.000110/` (chứa các file `__next.*.txt`) và file
`out/tthc/1.000110.html` cùng tồn tại. GitHub Pages phục vụ file `.html`, còn
`serve` ưu tiên thư mục và trả về **danh sách thư mục**. Kết quả: mọi chỉ số
đẹp một cách vô lý (điểm 100, TBT 0 ms) vì đang đo một trang gần như trống.

Muốn đo cục bộ thì cần máy chủ phân giải `P.html` trước `P`, giống GitHub Pages.
Cũng vì lý do tương tự, xem [[url-khong-dau-gach-cuoi]] trong ghi chú dự án.
