# Hướng dẫn vận hành

Địa chỉ hệ thống: **https://ttpvhcc.xanuicam.vn**
Kho mã nguồn: **https://github.com/dieuhanhcongviecxanuicam/ubnd-ttpvhcc-qr**

Hạ tầng hiện tại: mã nguồn trên GitHub, tự động triển khai lên GitHub Pages,
tên miền `ttpvhcc.xanuicam.vn` trỏ qua Cloudflare ở chế độ **DNS only** với bản ghi
`CNAME ttpvhcc → dieuhanhcongviecxanuicam.github.io`.

Tài liệu dành cho cán bộ phụ trách hệ thống. Ba việc thường gặp nhất nằm ở mục 1-3.

---

## 1. Cập nhật danh mục thủ tục hành chính

Khi có quyết định công bố TTHC mới (thêm, sửa, bãi bỏ thủ tục):

```bash
# Kích hoạt môi trường Python (lần đầu xem mục 5)
source .venv/bin/activate

# 1. Chép file Excel danh mục mới vào data/source/
# 2. Trích xuất lại dữ liệu
python3 scripts/trich-xuat-du-lieu.py

# 3. Sinh lại mã QR (số lĩnh vực có thể thay đổi)
python3 scripts/tao-ma-qr.py

# 4. Xác nhận mã QR trỏ đúng
python3 scripts/kiem-tra-ma-qr.py

# 5. Đẩy lên - hệ thống tự triển khai sau khoảng 2-3 phút
git add data public/qr
git commit -m "Cập nhật danh mục TTHC theo Quyết định số ..."
git push
```

**Quan trọng:** nếu danh sách lĩnh vực thay đổi thì mã QR của các lĩnh vực đó cũng
đổi. Phải **in và dán lại** mã QR tại quầy tương ứng. Bước 4 sẽ báo lỗi nếu có mã
QR nào không khớp.

## 2. In mã QR để dán tại quầy

1. Mở trang `/in-ma-qr/` trên website.
2. Đối chiếu URL nhỏ dưới mỗi mã QR - phải đúng tên miền đang triển khai.
3. Bấm **In trang này**, chọn khổ A4, bật *In hình nền/màu nền* để mã QR rõ nét.
4. Muốn in riêng một lĩnh vực: mở trang lĩnh vực đó và bấm **PNG** (in ấn) hoặc
   **SVG** (phóng to cỡ lớn không bị vỡ nét).

Trước khi dán, hãy dùng điện thoại quét thử ít nhất 2-3 mã bất kỳ.

## 3. Chuyển sang tên miền chính thức

Địa chỉ đích nằm **bên trong ảnh mã QR**, nên đổi tên miền bắt buộc phải sinh lại
và in lại toàn bộ mã QR.

```bash
export TEN_MIEN=https://ten-mien-moi.gov.vn

python3 scripts/tao-ma-qr.py      --base-url $TEN_MIEN
python3 scripts/kiem-tra-ma-qr.py --base-url $TEN_MIEN
```

Rồi cập nhật ba chỗ cho khớp:

1. `public/CNAME` - ghi tên miền mới (không kèm `https://`)
2. `src/lib/site-config.ts` - sửa giá trị mặc định của `SITE_ORIGIN`
3. Cài đặt **Settings → Pages → Custom domain** trên GitHub

Và trỏ bản ghi DNS `CNAME` của tên miền mới về `dieuhanhcongviecxanuicam.github.io`.

Cuối cùng: **thu hồi và thay thế toàn bộ mã QR đã dán** - mã cũ vẫn trỏ về tên
miền cũ.

## 4. Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Quét QR ra trang lỗi 404 | QR sinh theo tên miền khác với nơi đang triển khai | `python3 scripts/kiem-tra-ma-qr.py` rồi sinh lại, in lại |
| Website không cập nhật sau khi push | Workflow triển khai thất bại | Xem tab **Actions** trên GitHub |
| Trang trắng, thiếu định dạng | Thiếu `.nojekyll` nên GitHub Pages bỏ qua thư mục `_next/` | Kiểm tra bước "Thêm .nojekyll" trong `deploy.yml` |
| Tên miền riêng tự mất sau khi triển khai | Thiếu `public/CNAME` nên GitHub Pages gỡ cấu hình | Khôi phục `public/CNAME`, CI đã có bước chặn lỗi này |
| Trình duyệt báo cảnh báo chứng chỉ | GitHub chưa cấp được chứng chỉ HTTPS | Bật *Enforce HTTPS* trong Settings → Pages sau khi DNS đã phân giải |
| Số thủ tục hiển thị sai | `data/meta.json` chưa được sinh lại | Chạy lại `scripts/trich-xuat-du-lieu.py` |
| Script báo "slug lĩnh vực bị trùng" | Hai lĩnh vực khác nhau cho ra cùng một slug | Sửa tên lĩnh vực trong file Excel cho phân biệt được |

## 5. Kiểm thử pipeline khi chưa có file Excel

File Excel thật của đơn vị không nằm trong Git, nên muốn thử bước trích xuất mà
không có file đó thì dựng một file mẫu từ chính dữ liệu đang có:

```bash
python3 scripts/dung-excel-mau.py . /tmp/mau.xlsx
python3 scripts/trich-xuat-du-lieu.py /tmp/mau.xlsx --ngay-xuat 06/08/2026
git diff --stat data/
```

Kết quả đúng: `meta.json` và `linh-vuc.json` không đổi; `tthc.json` chỉ lệch 7
bản ghi có lĩnh vực rỗng, do bộ trích xuất bản mới chuẩn hoá chúng thành
"Chưa phân loại". Lệch nhiều hơn thế là dấu hiệu pipeline đã hỏng.

Nhớ `git checkout data/` sau khi thử, đừng commit dữ liệu sinh từ file mẫu.

Toàn bộ quy trình trên đã được đóng gói thành một lệnh, chạy trong thư mục tạm
nên không đụng vào `data/`:

```bash
python3 scripts/kiem-tra-pipeline.py
```

CI chạy lệnh này mỗi lần có pull request.

## 6. Chuẩn bị môi trường (làm một lần)

```bash
# Node.js 24 trở lên (bản LTS, xem .nvmrc)
npm install

# Python
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements-dev.txt
```

## 7. Cloudflare - bật cache cho trang (làm một lần)

**Đây là việc còn lại có tác động lớn nhất tới tốc độ tải trang.**

Cloudflare mặc định chỉ cache URL có phần mở rộng tĩnh. Dự án dùng
`trailingSlash: false` nên đường dẫn trang không có phần mở rộng, và Cloudflare
xếp chúng vào nội dung động: `cf-cache-status: DYNAMIC` trên mọi trang, tức **mỗi
lần tải trang đều đi trọn một vòng tới GitHub Pages**. Đó là lý do reload trang
thấy chậm. Nền tảng vấn đề ở `docs/HIEU-NANG.md` mục 5.2.

Toàn bộ phần cấu hình đã được viết thành script, chỉ cần cấp token.

### Bước 1. Tạo API token trên Cloudflare

Cloudflare > biểu tượng tài khoản > **My Profile** > **API Tokens** >
**Create Token** > **Create Custom Token**. Cấp đúng ba quyền, không rộng hơn:

| Loại | Mục | Mức |
|---|---|---|
| Zone | Zone | Read |
| Zone | Cache Rules | Edit |
| Zone | Cache Purge | Purge |

Ở **Zone Resources** chọn đúng zone `xanuicam.vn`, đừng chọn *All zones*.

### Bước 2. Áp Cache Rule

```bash
export CLOUDFLARE_API_TOKEN=...
python3 scripts/cau-hinh-cloudflare.py              # xem trước, không ghi gì
python3 scripts/cau-hinh-cloudflare.py --ap-dung    # ghi thật
```

Script đặt hai luật loại trừ nhau nên không phụ thuộc thứ tự áp dụng:

- `/_next/static/*` - tên file đã có băm nội dung nên bất biến, cache **một năm**
  ở cả biên lẫn trình duyệt. GitHub Pages đặt cứng 4 giờ và không cho sửa.
- Mọi đường dẫn còn lại - cache ở biên **một giờ**, còn thời hạn phía trình duyệt
  vẫn theo máy chủ gốc. Cố ý như vậy: cache ở biên thì xoá được ngay khi triển
  khai, cache trong máy người dân thì không.

Luật do người khác đặt tay trên dashboard **được giữ nguyên** - script chỉ quản
lý các luật có dấu `[ubnd-ttpvhcc-qr]` trong phần mô tả.

Kiểm lại sau vài giây:

```bash
curl -sI https://ttpvhcc.xanuicam.vn/ | grep -i cf-cache-status
```

Mong đợi `MISS` ở lượt đầu rồi `HIT` ở các lượt sau, thay vì `DYNAMIC`.

### Bước 3. Nạp token vào kho mã để tự xoá cache khi triển khai

Cache trang ở biên mà không xoá thì sau mỗi lần cập nhật, bản cũ còn được phục vụ
tới hết một giờ. Nạp token vào kho để việc xoá diễn ra tự động:

```bash
gh secret set CLOUDFLARE_API_TOKEN
```

Job `Xoá cache Cloudflare` trong `.github/workflows/deploy.yml` **tự bỏ qua khi
chưa có secret**, và tự chạy kể từ lúc token được nạp - không cần sửa gì thêm.

> **CẢNH BÁO:** chỉ đặt *Cache Rule*. **Không** động vào header
> `Content-Security-Policy` tại Cloudflare - xem `docs/BAO-MAT.md`.
>
> **Đừng đổi `trailingSlash` hay thêm đuôi `.html` vào route để lách chuyện
> cache.** Quy ước URL đang được mã hoá trong 78 mã QR đã in; đổi nó là phải sinh
> lại và in lại toàn bộ.

## 8. Sao lưu

Cần giữ lại: **file Excel nguồn** (`data/source/`, không nằm trong Git) và toàn bộ
kho mã nguồn trên GitHub. Có hai thứ này là dựng lại được toàn bộ hệ thống.
