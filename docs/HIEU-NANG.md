# Hiệu năng - số liệu cơ sở

Tài liệu này ghi lại kết quả đo Lighthouse lần đầu, để các lần thay đổi sau có
mốc mà đối chiếu. **Chưa tối ưu gì cả** - đây là hiện trạng, không phải mục tiêu.

## 1. Điều kiện đo

| Hạng mục | Giá trị |
|---|---|
| Ngày đo | 25/08/2026 |
| Công cụ | Lighthouse 12.8.2 |
| Trình duyệt | Chrome for Testing 151.0.7922.34, chế độ headless |
| Thiết bị mô phỏng | **Mobile** (điện thoại) |
| Điều tiết mạng | `devtools` (mặc định của Lighthouse) |
| Đối tượng đo | Trang thật <https://ttpvhcc.xanuicam.vn>, đi qua Cloudflare |

Đo trên **mobile** chứ không phải desktop, vì người dùng đến với site này chủ yếu
bằng cách quét mã QR bằng điện thoại ngay tại quầy.

Không đo bằng `python -m http.server` tại máy: kết quả sẽ sai lệch vì thiếu tầng
nén, cache và định tuyến URL của GitHub Pages với Cloudflare.

Số liệu ở mục 2 và 3 là **trước khi tối ưu**, giữ lại làm mốc đối chiếu. Thay
đổi đã áp dụng và số đo của nó nằm ở mục 4.

## 2. Điểm số

| Trang | Hiệu năng | Trợ năng | Thực hành tốt | SEO |
|---|---|---|---|---|
| Trang chủ `/` | 85 | **100** | **100** | 92 |
| Lĩnh vực `/linh-vuc/ho-tich` | 87 | **100** | **100** | 92 |
| Chi tiết `/tthc/1.000110` | 74 | **100** | **100** | 92 |

Trợ năng đạt 100/100 trên cả ba trang, khớp với kết quả 0 vi phạm WCAG 2.1 AA
của bộ test axe-core trong `tests/`.

## 3. Chỉ số Web Vitals

| Trang | FCP | LCP | TBT | CLS | Speed Index | Tổng tải |
|---|---|---|---|---|---|---|
| Trang chủ | 2,4 s | 2,4 s | 400 ms | 0,066 | 2,4 s | 534 KiB |
| Lĩnh vực | 2,3 s | 2,3 s | 380 ms | 0 | 2,3 s | 463 KiB |
| Chi tiết TTHC | 2,3 s | 2,3 s | **980 ms** | 0 | 2,3 s | 507 KiB |

LCP dưới 2,5 s ở cả ba trang - đạt ngưỡng "tốt" của Core Web Vitals.

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
