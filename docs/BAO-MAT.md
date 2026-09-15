# Bảo mật hệ thống

Tài liệu vận hành. Phần đánh giá tổng thể và lộ trình nằm ở hồ sơ đánh giá an
toàn thông tin riêng.

---

## 1. Kiến trúc phòng thủ

| Lớp              | Biện pháp                                    | Đặt ở đâu                |
| ---------------- | -------------------------------------------- | ------------------------ |
| Tên miền         | DNSSEC, CAA, khoá chuyển nhượng              | Cloudflare + nhà đăng ký |
| Biên mạng        | Chống DDoS, giới hạn tần suất, WAF, HSTS     | Cloudflare (mục 9)       |
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

### Secret trong kho mã

| Secret | Dùng ở đâu | Quyền tối thiểu |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | job `Xoá cache Cloudflare` trong `deploy.yml` | Zone/Zone/Read, Zone/Cache Purge/Purge |
| `CLOUDFLARE_API_TOKEN_BAO_VE` | workflow `Chế độ chống tấn công` (chạy tay) | Zone/Zone/Read, Zone Settings/Read, Zone WAF/Edit |

Hai token để **riêng** chứ không gộp một. Token xoá cache chạy tự động ở mọi lượt
triển khai, cạnh một job đang giữ `pages:write`; token bảo vệ có quyền đổi cấu
hình tường lửa nhưng chỉ chạy khi người trực bấm tay. Gộp lại là cho lượt triển
khai hằng ngày mang theo quyền sửa tường lửa mà nó không bao giờ dùng tới.

Token này **chỉ để xoá cache**. Đừng cấp thêm quyền và đừng dùng lại token có
quyền rộng: workflow triển khai vốn đã giữ `pages:write`, nên mọi quyền cộng
thêm vào đó đều làm tăng thiệt hại nếu workflow bị chiếm. Phạm vi zone phải chọn
đúng `xanuicam.vn`, không chọn *All zones*.

Token dùng để **đặt Cache Rule** (`scripts/cau-hinh-cloudflare.py`) cần thêm
quyền Zone/Cache Rules/Edit, nhưng chỉ chạy tay một lần và **không nạp vào kho
mã**. Xem `docs/VAN-HANH.md` mục 7.

Job xoá cache tự bỏ qua khi chưa có secret, nên việc chưa cấu hình không làm hỏng
lượt triển khai nào.

> **Việc cần làm sớm.** Token đang nằm trong secret được cấp ngày 26/08/2026 để
> áp Cache Rule, nên nó có **cả quyền Cache Rules / Edit** - rộng hơn mức job xoá
> cache cần. Hãy tạo token mới chỉ gồm Zone/Zone/Read và Zone/Cache Purge/Purge,
> thay bằng `gh secret set CLOUDFLARE_API_TOKEN`, rồi **thu hồi token cũ** ở
> Cloudflare > My Profile > API Tokens.

## 5. Rà soát định kỳ

| Việc                                   | Tần suất            | Cách làm                                        |
| -------------------------------------- | ------------------- | ----------------------------------------------- |
| Duyệt PR của Dependabot                | Hằng tuần           | Đọc changelog rồi hợp nhất; CI tự chặn nếu hỏng |
| Rà hai phụ thuộc đang hoãn (ESLint 10, TypeScript 6.1+) | Hằng quý | Điều kiện gỡ ghi trong `.github/dependabot.yml` và `CONTRIBUTING.md` |
| Đọc cảnh báo trong log CI và triển khai | Hằng tháng          | Tab **Actions** > lượt chạy gần nhất > phần *Annotations* |
| Xem cảnh báo CodeQL và secret scanning | Hằng tuần           | Tab **Security** của kho mã                     |
| Kiểm chứng mã QR                       | Mỗi lần đổi dữ liệu | `python3 scripts/kiem-tra-ma-qr.py`             |
| Kiểm tra header bảo mật                | Hằng quý            | Lệnh `curl` ở mục 3                             |
| Đối chiếu lớp bảo vệ Cloudflare        | Hằng quý            | `python3 scripts/bao-ve-cloudflare.py --kiem-tra` |
| Gia hạn `security.txt`                 | Hằng năm            | Sửa `Expires`; `npm test` kêu trước 60 ngày     |
| Rà quyền truy cập                      | Hằng quý            | Settings → Collaborators                        |
| Diễn tập khôi phục                     | Hằng năm            | Dựng lại hệ thống từ kho mã và tệp Excel nguồn  |

## 6. Khi nghi ngờ bị xâm nhập

1. **Bật chế độ chống tấn công** - ưu tiên cắt đường tiếp cận tới nội dung có
   thể đã bị sửa. Ba cách, chọn cách nào nhanh nhất lúc đó:
   - Tab **Actions** của kho mã > workflow **Chế độ chống tấn công** >
     `bat-chong-tan-cong` (chạy được từ điện thoại).
   - `python3 scripts/bao-ve-cloudflare.py --che-do-tan-cong bat`
   - Cloudflare dashboard > Security > WAF > Custom rules > bật luật
     `[ubnd-ttpvhcc-qr] CHẾ ĐỘ CHỐNG TẤN CÔNG` (đang để sẵn ở trạng thái tắt).

   **Đừng** dùng nút *Under Attack Mode* của dashboard: đó là cài đặt toàn zone,
   bật lên là dựng trang xác minh trước mặt mọi subdomain của `xanuicam.vn`, kể cả
   hệ thống khác không hề bị tấn công. Ba cách ở trên chỉ áp cho site này.

   Bật hay tắt đều cần **20-30 giây** mới có tác dụng ở mọi điểm biên. Nhớ **tắt
   lại** ngay khi hết đợt.
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

## 9. Chống DDoS, bot và spam IP

Site không có máy chủ ứng dụng để cài bộ đếm hay danh sách chặn: request bị chặn
hay không đã được quyết định xong ở Cloudflare, **trước khi** tới GitHub Pages.
Vì vậy toàn bộ lớp này nằm ở tầng biên, và được đưa vào kho mã dưới dạng
`scripts/bao-ve-cloudflare.py` để rà soát, ghi nhật ký và dựng lại được - thay vì
nằm trong trí nhớ của người từng bấm dashboard.

### Zone dùng chung với hệ thống khác

`xanuicam.vn` phục vụ nhiều subdomain. Khi áp dụng lần đầu (15/09/2026) zone đã có
sẵn luật của một ứng dụng khác, quản lý bởi `cloudflare-waf-apply.sh`: một luật
WAF và một luật chống brute-force cho `POST /api/auth/login`. Ba nguyên tắc rút ra:

- Script **chỉ tạo, sửa, xoá từng luật mang `ref` bắt đầu bằng
  `ubnd-ttpvhcc-qr-`**. Luật khác giữ nguyên ID, nội dung và vị trí - đã đối chiếu
  ID trước và sau khi áp dụng. (Bản đầu ghi đè cả bộ luật bằng `PUT`, đủ để làm
  hỏng script đang quản lý luật kia theo ID. Phát hiện nhờ đọc trước khi ghi, và
  đã sửa trước khi ghi lần nào.)
- Mọi luật của kho mã đều giới hạn bằng `http.host eq "ttpvhcc.xanuicam.vn"`.
- Cài đặt zone áp cho mọi subdomain, nên script **chỉ ghi khi giá trị lệch**.

### Các lớp đang chạy (đối chiếu ngày 15/09/2026)

| Lớp | Trạng thái | Người dân có thấy gì không |
|---|---|---|
| WAF: bỏ qua bot tìm kiếm đã xác minh | **Đang chạy** | Không |
| WAF: chặn đường dẫn quét lỗ hổng (`/wp-admin`, `/.env`, `/.git`, `*.php`, `*.sql`…) | **Đang chạy** - 9/9 đường dẫn thử trả 403 từ Cloudflare, 9/9 trang thật trả 200 | Không |
| Cài đặt zone: HSTS 1 năm + preload, TLS ≥ 1.2, luôn HTTPS, Browser Integrity Check, Security Level `medium` | **Đã đúng sẵn**, không phải ghi | Không |
| Công tắc chống tấn công | **Có sẵn, đang tắt** - đã thử bật/tắt thật | Chỉ khi bật |
| Giới hạn tần suất | **Nhường chỗ**, xem dưới | - |
| Bot Fight Mode | **Đang bật** (đơn vị bật tay 15/09/2026) - kèm xung đột với CSP, xem dưới | Không |

Ngoài các lớp trên, Cloudflare luôn chạy lớp chống DDoS tầng mạng và tầng HTTP tự
động ở mọi gói, không cần cấu hình.

**Giới hạn tần suất nhường chỗ.** Gói Free chỉ cho **một** luật giới hạn tần suất,
và chỗ đó đang giữ luật chống brute-force đăng nhập của hệ thống kia - thứ quan
trọng hơn nhiều so với giới hạn tần suất cho một trang tĩnh. Script tuyệt đối
không gỡ luật của ai để lấy chỗ. Gộp làm một cũng không được: một luật chỉ có một
ngưỡng, và ngưỡng 5 request/10 giây của trang đăng nhập áp lên trang tra cứu thì
chặn luôn người dân mở trang bình thường. Luật của site này (60 request/10 giây)
đã viết sẵn và tự áp dụng khi zone có thêm chỗ - nâng gói, hoặc hệ thống kia gỡ
luật của họ.

**Luật "điểm đe doạ cao" đã bị bỏ** trước khi áp dụng lần nào. Nó dựa trên
`cf.threat_score`, trường mà Cloudflare đã ngừng từ 30/09/2024 và nay **luôn trả
0** - luật đó sẽ không bao giờ khớp, chỉ tạo cảm giác an toàn giả. Trường thay thế
(`cf.waf.score`) chỉ có từ gói Business.

**Bot Fight Mode** cần bật tay: Cloudflare > Security > Bots > Bot Fight Mode.
Đơn vị đã bật ngày 15/09/2026 - kèm theo một xung đột phải biết, xem ngay dưới.

### Bot Fight Mode và CSP chặt: xung đột đã biết

Phần "JavaScript Detections" của Bot Fight Mode **chèn một script nội tuyến vào
mọi trang HTML** để dò trình duyệt thật. CSP của site chặn script đó, và mỗi lượt
tải trang ghi một lỗi trong console của trình duyệt:

```
Executing inline script violates the following Content-Security-Policy directive
'script-src 'self' 'sha256-...''
```

**Không băm được script này.** Nội dung của nó mang mã định danh riêng cho từng
lượt tải: `window.__CF$cv$params={r:'a3ba1a72ac625c35', t:'...'}`, hai lần tải là
hai giá trị khác nhau - đã kiểm bằng cách tải trang hai lần và so chuỗi. Băm
SHA-256 chỉ dùng được cho nội dung cố định.

Hậu quả thực tế:

| | |
|---|---|
| Người dân | Không ảnh hưởng - trang chạy bình thường, script bị chặn chỉ là phần dò bot của Cloudflare |
| Bot Fight Mode | Mất tín hiệu JavaScript; các tín hiệu còn lại (danh tiếng IP, dấu vân tay kết nối) vẫn chạy |
| Nhật ký | Mỗi lượt xem trang ghi một lỗi CSP trong console |

**Trên gói Free KHÔNG tắt riêng được phần JavaScript Detections.** Tài liệu
Cloudflare nói rõ: với Bot Fight Mode, JS detections bật kèm và không tắt được;
chỉ Super Bot Fight Mode (từ gói Pro) mới tách công tắc riêng. Nên lựa chọn thật
sự chỉ còn:

1. **Tắt hẳn Bot Fight Mode** (chọn tên miền `xanuicam.vn` > Security > Settings >
   Bot fight mode). Các lớp còn lại vẫn nguyên: luật WAF chặn đường dẫn quét lỗ
   hổng, Browser Integrity Check, và lớp chống DDoS tự động mà Cloudflare luôn
   chạy ở mọi gói. Kiểm chứng:
   `curl -s "https://ttpvhcc.xanuicam.vn/?t=$RANDOM" | grep -c '__CF$cv$params'`
   phải trả `0`.

   > **Đã gặp: tắt rồi mà script vẫn được chèn.** Ngày 16/09/2026, sau khi tắt Bot
   > Fight Mode, lượt tải mới hoàn toàn (`cf-cache-status: MISS`) vẫn còn script,
   > trong khi trang gốc GitHub Pages không có - tức Cloudflare vẫn chèn, không
   > phải do cache. Đây là hiện tượng đã có người báo trên diễn đàn Cloudflare
   > ("JS Detections stuck on with Bot Fight Mode off"). Cách xử lý theo thứ tự:
   > tải lại trang cài đặt để chắc công tắc đã lưu; bật lại rồi tắt lần nữa; kiểm
   > mục *Configure AI bot policies* và *AI Crawl Control* xem có chính sách nào
   > đang bật kéo theo JS detections; nếu vẫn còn thì mở ticket với Cloudflare.
   > Trong lúc chờ, hệ thống không hỏng gì - chỉ là lỗi trong console.
2. **Giữ Bot Fight Mode, chấp nhận lỗi console.** Cần biết rõ cái giá: tín hiệu
   JavaScript - phần đáng giá nhất của Bot Fight Mode - đã bị CSP chặn nên không
   chạy; thứ còn lại là các tín hiệu danh tiếng IP và dấu vân tay kết nối.
3. **Nâng lên gói Pro** để dùng Super Bot Fight Mode, nơi JS detections bật/tắt
   riêng được. Chỉ đáng khi đơn vị cần thêm các tính năng khác của gói Pro.
4. **Đừng** thêm `'unsafe-inline'` vào `script-src` để "cho qua". Làm vậy là phá
   bỏ chính lớp bảo vệ mà `scripts/them-csp.mjs` dựng nên: băm từng khối script
   để trang không thể bị chèn mã lạ. Đánh đổi sai hướng.

Lưu ý zone dùng chung: Bot Fight Mode áp cho cả `xanuicam.vn`, nên quyết định này
ảnh hưởng luôn hệ thống khác trên cùng zone.

```bash
export CLOUDFLARE_API_TOKEN=...                       # xem quyền ở đầu script
python3 scripts/bao-ve-cloudflare.py                  # xem trước, không ghi gì
python3 scripts/bao-ve-cloudflare.py --ap-dung        # đồng bộ các lớp
python3 scripts/bao-ve-cloudflare.py --kiem-tra       # đọc trạng thái đang chạy
```

### Vì sao KHÔNG bật trang xác minh cho mọi người như grok.com

Under Attack Mode bắt **mọi** người truy cập qua một trang xác minh vài giây.
Trên một trang dịch vụ công, cái giá đó rơi đúng vào người dân:

- Quét mã QR tại quầy phải chờ thêm mỗi lần mở trang; trên máy cũ hoặc trình
  duyệt hiếm, bước xác minh có thể **thất bại hẳn** - khi đó họ mất luôn đường
  tra cứu thủ tục.
- Người dùng trình đọc màn hình và bàn phím gặp thêm một rào cản, trong khi dự án
  cam kết WCAG 2.1 AA.
- Bot tìm kiếm bị chặn, trang rụng khỏi kết quả tìm kiếm.
- Nội dung ở đây là thông tin **bắt buộc phải niêm yết công khai**. Bắt người dân
  chứng minh mình không phải máy để đọc thông tin công khai là đặt sai ưu tiên.

Nên chế độ này là **công tắc sự cố**, không phải cấu hình thường trực: bật khi
đang bị tấn công thật, tắt ngay khi hết đợt. Cách bật ở mục 6.

Công tắc là một luật WAF `managed_challenge` chỉ khớp host của site này, **không
phải** Under Attack Mode của Cloudflare - dù người dân thấy cùng một trang
"Thực hiện xác minh bảo mật". Hai lý do: Under Attack Mode là cài đặt toàn zone
nên sẽ chặn cả hệ thống khác; và luật bỏ qua bot tìm kiếm đứng trước công tắc,
nên đang chống tấn công trang vẫn không rụng khỏi kết quả tìm kiếm. Kẻ tấn công
không giả được trạng thái "bot đã xác minh": Cloudflare xác minh bằng IP và DNS
ngược, không bằng User-Agent.

Đã thử thật ngày 15/09/2026: bật thì mọi request nhận `403` kèm
`cf-mitigated: challenge` và trang xác minh tiếng Việt của Cloudflare; tắt thì hai
lượt tải đầu vẫn gặp xác minh, từ giây thứ 15-20 trở lại `200` ổn định.

### Giới hạn cần biết, không nên tự huyễn hoặc

- **Không có bảo mật tuyệt đối.** Lớp này làm cho tấn công dội request trở nên
  đắt đỏ và vô ích, chứ không làm nó bất khả thi.
- Máy chủ gốc là GitHub Pages - hạ tầng vốn đã chịu tải tốt và chỉ phục vụ tệp
  tĩnh, không có mã thực thi để chiếm. Kịch bản đáng lo không phải "sập máy chủ"
  mà là **chiếm tài khoản** GitHub hoặc Cloudflare; phòng thủ cho việc đó là 2FA
  và branch protection ở mục 4, không phải tường lửa.
- Địa chỉ gốc `dieuhanhcongviecxanuicam.github.io` vẫn truy cập trực tiếp được,
  không qua Cloudflare. Đó là cách GitHub Pages hoạt động, không tắt được. Nội
  dung ở đó giống hệt và là thông tin công khai, nên rủi ro là *lách qua lớp giới
  hạn tần suất*, không phải lộ dữ liệu.

### Kênh báo lỗ hổng: `security.txt`

`public/.well-known/security.txt` theo RFC 9116, phục vụ tại
`https://ttpvhcc.xanuicam.vn/.well-known/security.txt`. Công cụ quét và người
nghiên cứu bảo mật đọc tệp này trước khi tìm cách liên hệ.

> **Cạm bẫy đã gặp.** `actions/upload-pages-artifact` đóng gói bằng `tar` kèm
> `--exclude=.[^/]*`, nên nó ném đi **mọi mục bắt đầu bằng dấu chấm** - cả
> `.well-known/` lẫn `.nojekyll`. Tệp có mặt trong `out/`, build và deploy đều
> xanh, nhưng URL trả 404. Từ 1.13.1, `deploy.yml` tự đóng gói và có bước chặn
> deploy nếu gói thiếu tệp bắt buộc.

Trường `Expires` là thứ duy nhất trong kho mã **tự hỏng theo thời gian**: quá hạn
thì theo RFC, tệp phải bị coi là không còn hiệu lực. `tests/bao-mat.test.ts` bắt
đầu báo đỏ trước 60 ngày để còn kịp gia hạn.
