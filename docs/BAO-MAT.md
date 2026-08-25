# Bảo mật hệ thống

Tài liệu vận hành. Phần đánh giá tổng thể và lộ trình nằm ở hồ sơ đánh giá an
toàn thông tin riêng.

---

## 1. Kiến trúc phòng thủ

| Lớp              | Biện pháp                                    | Đặt ở đâu                |
| ---------------- | -------------------------------------------- | ------------------------ |
| Tên miền         | DNSSEC, CAA, khoá chuyển nhượng              | Cloudflare + nhà đăng ký |
| Biên mạng        | Chống DDoS, HSTS, header bảo mật             | Cloudflare               |
| Phục vụ nội dung | Chỉ tệp tĩnh, không thành phần thực thi      | GitHub Pages             |
| Trình duyệt      | CSP theo từng trang, dùng băm script         | Sinh lúc build           |
| Chuỗi build      | Ghim Action theo SHA, quét phụ thuộc, CodeQL | GitHub Actions           |
| Truy cập         | Branch protection, bắt buộc PR, 2FA          | Cài đặt kho mã           |

## 2. Content-Security-Policy

CSP được **sinh tự động sau mỗi lần build** bởi `scripts/them-csp.mjs`, chèn vào
từng trang dưới dạng thẻ `<meta http-equiv>`.

Next sinh vài khối `<script>` nội tuyến chứa dữ liệu render. Thay vì nới lỏng
bằng `'unsafe-inline'`, script băm SHA-256 từng khối và liệt kê băm vào
`script-src`. Mỗi trang có bộ băm riêng.

`scripts/kiem-tra-csp.mjs` chạy trong CI, chặn hai tình huống hỏng âm thầm:
trang thiếu thẻ CSP, và băm không khớp script thật (trình duyệt sẽ chặn script
làm trang trắng, trong khi build vẫn báo thành công).

> **Khi thử bản build cục bộ qua HTTP:** directive `upgrade-insecure-requests`
> khiến trình duyệt nâng các request prefetch lên `https://localhost`, sinh lỗi
> SSL trong console. Đây chỉ là ma sát khi thử cục bộ - trang vẫn hoạt động, và
> trên production mọi thứ đã là HTTPS nên directive này không gây ảnh hưởng.

### Cloudflare Web Analytics - cần quyết định

Cloudflare **tự chèn** `beacon.min.js` từ `static.cloudflareinsights.com` vào mọi
trang ở tầng biên; kho mã không khai báo script này. CSP hiện đang cho phép nó,
nếu không mọi lượt truy cập đều sinh lỗi trong console.

Đây là script bên thứ ba chạy trên máy người dân. Cloudflare Web Analytics không
dùng cookie và không định danh cá nhân, nhưng vẫn là thu thập dữ liệu truy cập.

**Đơn vị cần chọn một trong hai:**

| Lựa chọn                                      | Việc cần làm                                                                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Không cần thống kê truy cập** (an toàn hơn) | Tắt Web Analytics trong Cloudflare, rồi xoá hằng số `CLOUDFLARE_BEACON` trong `scripts/them-csp.mjs`. Chính sách trở lại chỉ-cho-phép-cùng-miền. |
| **Cần thống kê truy cập**                     | Giữ nguyên. Ghi nhận trong hồ sơ cấp độ an toàn thông tin rằng hệ thống có sử dụng dịch vụ đo lượt truy cập của bên thứ ba.                      |

### Hai directive phải đặt bằng header, không đặt được trong thẻ meta

Trình duyệt **bỏ qua** `frame-ancestors` và `report-uri` khi chúng nằm trong thẻ
`meta`. Chúng phải được đặt ở tầng Cloudflare - xem mục 3.

## 3. Header bảo mật đặt tại Cloudflare

GitHub Pages không cho đặt header HTTP tuỳ ý. Phần này cấu hình một lần trên
Cloudflare, không nằm trong kho mã.

**Đã cấu hình và xác minh hoạt động ngày 26/08/2026** - đủ 7/7 header trên mọi
đường dẫn, kể cả ảnh QR, sitemap và trang 404.

Vị trí: **Cloudflare → Rules → Transform Rules → Modify Response Header**
(lưu ý: *Response*, không phải *Request*).
Áp dụng cho: `Hostname equals ttpvhcc.xanuicam.vn`

Các header đang đặt:

| Header                         | Giá trị                                                        | Chặn được gì                                                            |
| ------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `Content-Security-Policy`      | `frame-ancestors 'none'`                                       | Nhúng trang vào iframe của site lừa đảo để mượn uy tín cơ quan nhà nước |
| `X-Frame-Options`              | `DENY`                                                         | Như trên, cho trình duyệt cũ                                            |
| `Referrer-Policy`              | `strict-origin-when-cross-origin`                              | Rò rỉ đường dẫn đang xem sang site bên ngoài                            |
| `Permissions-Policy`           | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Mã lạ xin quyền thiết bị                                                |
| `Cross-Origin-Opener-Policy`   | `same-origin`                                                  | Cửa sổ khác thao túng ngữ cảnh trang                                    |
| `Cross-Origin-Resource-Policy` | `same-site`                                                    | Site khác nhúng tài nguyên của hệ thống                                 |
| `X-Content-Type-Options`       | `nosniff`                                                      | Đã có sẵn từ GitHub Pages, đặt lại để chắc chắn                         |

> **Quan trọng - đừng mở rộng header CSP này.** Trang đã có CSP đầy đủ trong thẻ
> `meta` do build sinh ra (mục 2). Khi có hai chính sách CSP cùng lúc, trình duyệt
> áp dụng **giao** của cả hai. Nếu thêm directive khác vào header Cloudflare, ví dụ
> `default-src 'self'`, nó sẽ không biết các băm script của từng trang và **chặn
> luôn script của chính trang**, làm trang trắng. Header ở đây chỉ nên chứa đúng
> `frame-ancestors` - directive duy nhất mà thẻ `meta` không làm được.

**Kiểm tra định kỳ:**

```bash
curl -sI https://ttpvhcc.xanuicam.vn/ | grep -iE 'content-security|x-frame|referrer|permissions|cross-origin'
```

Kiểm tra chống nhúng khung có thực sự hoạt động: mở một trang HTML bất kỳ ở máy
khác chứa `<iframe src="https://ttpvhcc.xanuicam.vn/"></iframe>`, iframe phải
trống và console báo *"Framing ... violates ... frame-ancestors 'none'"*.

### Chế độ SSL/TLS

**Cloudflare → SSL/TLS → Overview** phải ở mức **Full** trở lên. Nếu để
_Flexible_, chặng từ Cloudflare tới GitHub Pages đi bằng HTTP thuần dù người dùng
vẫn thấy biểu tượng ổ khoá.

## 4. Kiểm soát truy cập

- Nhánh `main` được bảo vệ: bắt buộc pull request, bắt buộc CI xanh mới hợp nhất,
  cấm force-push và xoá nhánh.
- **Bật 2FA** cho mọi tài khoản có quyền vào kho mã và vào Cloudflare. Đây là
  biện pháp đơn lẻ có hiệu quả cao nhất trong toàn bộ danh mục này.
- Rà lại danh sách cộng tác viên theo quý, gỡ người không còn nhiệm vụ.
- Bật **khoá chuyển nhượng tên miền** tại nhà đăng ký `xanuicam.vn`.

## 5. Rà soát định kỳ

| Việc                                   | Tần suất            | Cách làm                                        |
| -------------------------------------- | ------------------- | ----------------------------------------------- |
| Duyệt PR của Dependabot                | Hằng tuần           | Đọc changelog rồi hợp nhất; CI tự chặn nếu hỏng |
| Xem cảnh báo CodeQL và secret scanning | Hằng tuần           | Tab **Security** của kho mã                     |
| Kiểm chứng mã QR                       | Mỗi lần đổi dữ liệu | `python3 scripts/kiem-tra-ma-qr.py`             |
| Kiểm tra header bảo mật                | Hằng quý            | Lệnh `curl` ở mục 3                             |
| Rà quyền truy cập                      | Hằng quý            | Settings → Collaborators                        |
| Diễn tập khôi phục                     | Hằng năm            | Dựng lại hệ thống từ kho mã và tệp Excel nguồn  |

## 6. Khi nghi ngờ bị xâm nhập

1. **Vào Cloudflare bật Under Attack Mode** hoặc tạm trỏ tên miền đi nơi khác -
   ưu tiên cắt đường tiếp cận của người dân tới nội dung có thể đã bị sửa.
2. Đối chiếu lịch sử commit gần nhất: `git log --oneline -20` và tab **Actions**
   xem có lần triển khai nào lạ không.
3. Thu hồi toàn bộ token và khoá SSH của các tài khoản liên quan; đổi mật khẩu,
   bật lại 2FA.
4. Khôi phục bằng cách `git revert` về commit lành rồi để CI triển khai lại.
5. **Kiểm tra lại mã QR**: `python3 scripts/kiem-tra-ma-qr.py`. Nếu tên miền từng
   bị chiếm, phải rà xem mã QR đã dán tại quầy có còn trỏ đúng không.
6. Lập biên bản sự cố và báo cáo theo quy định về ứng cứu sự cố an toàn thông tin,
   đối chiếu với cấp độ an toàn hệ thống thông tin đã được phê duyệt của đơn vị.

## 7. Hồ sơ cấp độ an toàn thông tin

Đơn vị **đã được cấp Quyết định phê duyệt cấp độ an toàn hệ thống thông tin** hợp
lệ, không cần lập hồ sơ đề xuất mới.

Cần rà lại hồ sơ khi hệ thống thay đổi bản chất, đặc biệt nếu về sau bổ sung:
biểu mẫu thu thập thông tin công dân, tài khoản đăng nhập, cơ sở dữ liệu, hoặc
công cụ đo lượt truy cập của bên thứ ba. Ở trạng thái hiện tại hệ thống không có
những thành phần đó.

## 8. Những gì hệ thống KHÔNG lưu

Không tài khoản người dùng, không cơ sở dữ liệu, không cookie, không biểu mẫu thu
thập thông tin. Dữ liệu thủ tục hành chính là thông tin công khai từ Cổng Dịch vụ
công Quốc gia.

Cloudflare Web Analytics đã được tắt, nên hiện **không có bên thứ ba nào** ghi
nhận lượt truy cập.

Hệ quả: **không có dữ liệu cá nhân nào để rò rỉ**. Nếu về sau bổ sung biểu mẫu
hoặc công cụ thống kê, phải đánh giá lại nghĩa vụ theo quy định về bảo vệ dữ liệu
cá nhân trước khi triển khai.
