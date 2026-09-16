# Việc cần đơn vị thực hiện

Danh sách những việc **người vận hành phải tự làm hoặc tự quyết**, vì cần quyền
quản trị, cần truy cập bảng điều khiển bên ngoài, hoặc là quyết định thuộc thẩm
quyền của đơn vị. Mọi việc kỹ thuật còn lại đã làm xong trong kho mã.

Cập nhật lần cuối: **16/09/2026** (bản 1.21.0).

Làm xong mục nào thì đánh dấu `[x]` và ghi ngày vào cột ghi chú, hoặc xoá mục đó
qua một pull request.

## Tóm tắt

| # | Việc | Mức ưu tiên | Thời gian |
|---|---|---|---|
| 1 | Dọn 4 nhánh cũ trên GitHub, bật tự xoá nhánh | Thấp | 2 phút |
| 2 | Quyết định tên site trên tab trình duyệt và màn hình chính điện thoại | Trung bình | 5 phút |
| 3 | Kiểm tra xem trước liên kết khi chia sẻ qua Zalo | Trung bình | 5 phút |
| 4 | Chạy đối chiếu sản xuất đầy đủ từ mạng thường, hằng tháng | Trung bình | 5 phút/lần |
| 5 | Cập nhật danh mục TTHC từ file Excel mới | **Cao** | 30 phút |
| 6 | Rà soát bảo mật tài khoản và tên miền | **Cao** | 15 phút |
| 7 | Rà hai phụ thuộc đang hoãn, hằng quý | Thấp | 5 phút/lần |

---

## 1. Dọn nhánh cũ trên GitHub

- [ ] Xoá 4 nhánh
- [ ] Bật tự xoá nhánh sau khi hợp nhất

Bốn nhánh dưới đây thuộc các pull request **đã hợp nhất** (#53, #54, #58, #59) nhưng
vẫn còn trên GitHub. Không gây hại, chỉ làm rối danh sách nhánh.

```bash
git push origin --delete canh-san-xuat chan-chen-script ghi-nhan-xung-dot-bfm-csp quyen-transform
```

Để không phải dọn tay về sau, bật tự xoá nhánh khi hợp nhất pull request (hiện
đang tắt):

```bash
gh api -X PATCH repos/dieuhanhcongviecxanuicam/ubnd-ttpvhcc-qr -F delete_branch_on_merge=true
```

Hoặc trên web: **Settings → General → Pull Requests → Automatically delete head
branches**.

**Vì sao agent không làm:** xoá nhánh trên kho từ xa và đổi cài đặt kho là thao tác
khó hoàn tác, cần người có quyền quản trị xác nhận.

## 2. Quyết định tên site trên tab trình duyệt và màn hình chính

- [ ] Đã quyết định

Từ bản 1.20.0, header hiển thị **"Trung tâm Phục vụ Hành chính công / Xã Núi
Cấm"**. Nhưng ba chỗ khác vẫn dùng tên ngắn cũ **"Tra cứu TTHC"**
(`SITE_CONFIG.ten` trong `src/lib/site-config.ts`):

| Chỗ hiển thị | Hiện tại | Giới hạn thực tế |
|---|---|---|
| Tiêu đề tab trình duyệt | "In bộ mã QR - Tra cứu TTHC" | Tab thường chỉ hiện khoảng 25-30 ký tự |
| Tên dưới biểu tượng khi thêm vào màn hình chính điện thoại | "Tra cứu TTHC" | Khoảng 12 ký tự, dài hơn bị cắt thành "Trung tâm Ph…" |
| Tên site khi chia sẻ liên kết (Zalo, Facebook) | "Tra cứu TTHC" | Không giới hạn chặt |

Các lựa chọn:

| Lựa chọn | Ưu | Nhược |
|---|---|---|
| **Giữ "Tra cứu TTHC"** (khuyến nghị cho tab và màn hình chính) | Ngắn, nói đúng việc người dân làm trên site | Không trùng tên header |
| Đổi thành "TTPVHCC Núi Cấm" | Gắn với đơn vị, vẫn ngắn | Người dân ít quen chữ viết tắt |
| Đổi thành tên đầy đủ | Trùng header | Bị cắt trên tab và màn hình chính |

Có thể tách riêng: giữ tên ngắn cho tab và màn hình chính, dùng tên đầy đủ khi
chia sẻ liên kết. Báo lựa chọn cho người bảo trì mã, việc sửa chỉ mất vài dòng.

## 3. Kiểm tra xem trước liên kết khi chia sẻ qua Zalo

- [ ] Đã kiểm tra, kết quả: ....................

Bot Fight Mode đang bật trên zone `xanuicam.vn` vì hệ thống khác cần. Ngày
16/09/2026 đã đo được: các lượt gọi từ **máy chủ trong trung tâm dữ liệu** (máy chạy
GitHub Actions) bị Cloudflare trả trang thách thức (HTTP 403, header
`cf-mitigated: challenge`) ở trang chủ và `sitemap.xml`. Người dùng thật và Googlebot
không bị ảnh hưởng.

Trình tạo bản xem trước liên kết của Zalo cũng chạy từ máy chủ, và **có thể** bị
chặn theo cách tương tự - khi đó chia sẻ liên kết trong Zalo sẽ không hiện ảnh
và tiêu đề. Chưa kiểm được từ phía kỹ thuật vì Cloudflare chặn theo loại địa chỉ
IP, không theo tên trình duyệt.

Cách kiểm:

1. Gửi `https://ttpvhcc.xanuicam.vn/linh-vuc/ho-tich` vào một cuộc trò chuyện Zalo.
2. Xem có hiện khung xem trước (logo, tiêu đề) hay chỉ hiện đường dẫn trơn.
3. Làm tương tự với Facebook Messenger để so sánh.

Nếu Zalo không hiện xem trước: trên gói Free không thể miễn trừ Bot Fight Mode cho
riêng một tên miền con. Hai hướng xử lý, cần bàn với đơn vị đang dùng Bot Fight
Mode: chấp nhận mất xem trước, hoặc tắt Bot Fight Mode và dựa vào các lớp bảo vệ
còn lại (luật WAF, giới hạn tần suất, Browser Integrity Check). Chi tiết các lớp:
`docs/BAO-MAT.md` mục 9.

## 4. Đối chiếu sản xuất đầy đủ từ mạng thường

- [ ] Tháng 10/2026
- [ ] Tháng 11/2026
- [ ] Tháng 12/2026

Job **"Canh nội dung trên sản xuất"** chạy tự động 09:00 mỗi sáng. Do Bot Fight Mode
(mục 3), từ máy chủ GitHub job chỉ kiểm được **2/4 mục** (`robots.txt`,
`security.txt`); hai mục còn lại (`sitemap.xml`, CSP trang chủ) được báo là
**"KHÔNG KIỂM ĐƯỢC"** kèm cảnh báo vàng thay vì báo lỗi đỏ mỗi ngày.

Để kiểm đủ 4/4, mỗi tháng chạy một lần trên máy tính trong mạng thường:

```bash
git switch main && git pull
npm ci
npm run build
npm run kiem-tra-san-xuat
```

Kết quả mong đợi: `SẢN XUẤT: 4/4 mục kiểm được đều khớp`. Nếu báo lệch, xem
hướng dẫn in ra ngay dưới và `docs/BAO-MAT.md` mục 9.

## 5. Cập nhật danh mục thủ tục hành chính

- [ ] Đã lấy file Excel mới từ Cổng Dịch vụ công Quốc gia
- [ ] Đã cập nhật và triển khai

Dữ liệu hiện tại xuất ngày **06/08/2026** (376 thủ tục, 77 lĩnh vực). Thủ tục hành
chính thay đổi theo các quyết định công bố, nên cần lấy bản mới định kỳ hoặc mỗi
khi có quyết định công bố TTHC.

Lần cập nhật này cũng tự sửa **7 bản ghi** đang để trống lĩnh vực - chúng sinh từ
bản script cũ. Website vẫn hiển thị đúng (xếp vào "Chưa phân loại") nên không gấp,
nhưng sẽ hết hẳn khi trích xuất lại từ Excel chính thức.

Các bước: `docs/VAN-HANH.md` mục 1. **Nếu danh sách lĩnh vực thay đổi thì phải in
và dán lại mã QR** tại quầy tương ứng.

Lưu ý: **không dùng** dữ liệu sinh từ `scripts/dung-excel-mau.py` - đó là file
mẫu để kiểm thử.

## 6. Rà soát bảo mật tài khoản và tên miền

- [ ] Xác thực hai lớp (2FA) trên tài khoản GitHub có quyền quản trị kho
- [ ] Xác thực hai lớp trên tài khoản Cloudflare
- [ ] Chế độ SSL/TLS của Cloudflare là **Full** (không phải Flexible)
- [ ] Tên miền `xanuicam.vn` đã bật **khoá chuyển nhượng** tại nhà đăng ký
- [ ] Danh sách người có quyền trên kho (Settings → Collaborators) đúng người

Ba mục đầu và mục khoá tên miền **không kiểm được từ phía kỹ thuật** vì nằm trong
tài khoản cá nhân và bảng điều khiển của nhà đăng ký tên miền. Mất một trong các
tài khoản này là mất quyền kiểm soát site, và mọi mã QR đã in có thể bị trỏ đi
nơi khác.

Cách kiểm từng mục và lịch rà soát đầy đủ: `docs/BAO-MAT.md` mục 3 và mục 5.

## 7. Rà hai phụ thuộc đang hoãn

- [ ] Quý IV/2026

ESLint 10 và TypeScript 6.1+ đang bị hoãn vì thư viện bên thứ ba chưa hỗ trợ. Kiểm
lại ngày 16/09/2026, **vẫn chưa hỗ trợ**:

```bash
npm view eslint-plugin-react peerDependencies   # cần có ^10 - hiện: ^3 ... ^9.7
npm view typescript-eslint peerDependencies     # cần typescript không chặn <6.1.0
```

Khi cả hai điều kiện thoả, gỡ dòng `ignore` tương ứng trong
`.github/dependabot.yml` - Dependabot sẽ tự mở pull request nâng cấp, CI kiểm chứng.
Không cần làm gì khác trước thời điểm đó.
