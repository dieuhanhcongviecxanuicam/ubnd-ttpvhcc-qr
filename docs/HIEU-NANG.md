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

Điểm hiệu năng của trang chi tiết thấp hơn hẳn (74) là do **TBT 980 ms**, gần
gấp ba hai trang kia. Nguyên nhân: trang chi tiết dựng nhiều khối nội dung dài
(trình tự thực hiện, thành phần hồ sơ, căn cứ pháp lý), làm thời gian chạy
JavaScript trên luồng chính lên 2,8 s. Đây là chỗ đáng tối ưu đầu tiên nếu sau
này cần cải thiện.

## 4. Hai vấn đề nằm ngoài kho mã

Cả hai đều thuộc cấu hình Cloudflare/GitHub Pages, **không sửa được bằng cách
đổi mã nguồn**. Ghi lại để đơn vị quyết định.

### 4.1. SEO bị giữ ở 92 vì `robots.txt`

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

### 4.2. Thời hạn cache quá ngắn cho file có băm nội dung

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

## 5. Đo lại

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
