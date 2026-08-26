# Hướng dẫn đóng góp

## Quy trình

Nhánh `main` được bảo vệ, **áp dụng cho cả tài khoản quản trị**. Mọi thay đổi đều
phải đi qua pull request và chờ CI xanh.

```bash
git switch -c ten-nhanh-mo-ta-viec-can-lam
# ... sửa mã ...
npm run kiem-tra          # typecheck + lint + test, chạy trước khi đẩy
git commit -am "Mô tả thay đổi"
git push -u origin ten-nhanh-mo-ta-viec-can-lam
gh pr create
```

Ba kiểm tra bắt buộc phải xanh mới hợp nhất được:

| Kiểm tra | Nội dung |
|---|---|
| `Typecheck, lint, test, build` | Phiên bản, kiểu TypeScript, ESLint, test, build, CSP, CNAME, trợ năng, lỗ hổng npm |
| `Đối chiếu mã QR với route` | Giải mã ngược 78 mã QR, đối chiếu URL, quét CVE Python |
| `Phân tích JavaScript/TypeScript` | CodeQL |

> Nếu đổi tên job trong `.github/workflows/ci.yml`, **phải cập nhật tên check
> tương ứng trong Settings → Branches → Branch protection rules**. Quên bước này
> là mọi pull request bị khoá vĩnh viễn vì chờ một check không bao giờ xuất hiện.

## Nhật ký thay đổi và phiên bản

**Mọi pull request có thay đổi nhìn thấy được đều phải cập nhật
[`CHANGELOG.md`](CHANGELOG.md)** - kể cả thay đổi hạ tầng, CI hay tài liệu. Bảy
pull request liên tiếp (#11-#17) đã quên bước này và phải ghi bù về sau, lúc đó
lý do của từng quyết định đã khó dựng lại.

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Ghi
**vì sao** chứ không chỉ ghi *cái gì*: số đo, phương án đã loại và lý do loại là
phần có giá trị nhất cho người đọc sau này.

Mỗi khi thêm một mục phát hành mới, nâng luôn `version` trong `package.json` cho
khớp. Bước CI `npm run kiem-tra-phien-ban` đối chiếu hai chỗ này và sẽ chặn pull
request nếu chúng lệch nhau.

## Lệnh hay dùng

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Máy chủ phát triển |
| `npm run kiem-tra` | Typecheck, lint, test - chạy trước mỗi lần đẩy mã |
| `npm test` | Chỉ chạy test |
| `npm run build` | Build tĩnh, **đã gồm bước sinh CSP** |
| `npm run kiem-tra-csp` | Kiểm chứng CSP của bản build |
| `npm run kiem-tra-phien-ban` | Đối chiếu `package.json` với `CHANGELOG.md` |
| `npm run kiem-tra-qr` | Đối chiếu nội dung mã QR với route thật |

**Luôn dùng `npm run build`, không gọi `npx next build` trực tiếp** - lệnh build
đã gói sẵn bước sinh CSP. Thiếu bước đó, trình duyệt chặn script và trang trắng.

## Test

Dùng bộ chạy test có sẵn của Node, không thêm framework.

- `tests/text.test.ts` - tiện ích xử lý chuỗi tiếng Việt, đặc biệt là thuật toán
  tô sáng từ khoá bỏ dấu nhưng vẫn trả đúng đoạn có dấu.
- `tests/du-lieu.test.ts` - **bất biến dữ liệu**. Quan trọng nhất là phép đối
  chiếu `so_luong_tthc` với số mã giải được trong `danh_sach_ma_tthc`: đây chính
  là lỗi từng lọt ra production, khi trang lĩnh vực "Chưa phân loại" hiển thị
  "7 thủ tục hành chính" nhưng danh sách trống.

Sau mỗi lần cập nhật dữ liệu từ Excel, chạy `npm test` trước khi mở pull request.

## Quy ước mã nguồn

- **Định danh trong mã dùng tiếng Anh hoặc tiếng Việt không dấu**; chuỗi hiển thị
  cho người dùng và tên trường dữ liệu giữ nguyên tiếng Việt có dấu.
- **Route hiển thị dùng tiếng Việt không dấu**: `/linh-vuc/<slug>`, `/tthc/<mã>`.
- **URL không có dấu `/` ở cuối** (`trailingSlash: false`). Đổi quy ước này bắt
  buộc phải sinh lại toàn bộ 78 mã QR.
- **Không dùng dấu gạch dài** `—` hay `–` trong mã nguồn và tài liệu, chỉ dùng `-`.
- Trợ năng: mọi ô nhập phải có nhãn; giữ mức tương phản đạt WCAG 2.1 AA.

## Cập nhật dữ liệu và thương hiệu

Xem [`docs/VAN-HANH.md`](docs/VAN-HANH.md) cho quy trình cập nhật danh mục TTHC
và in mã QR, [`brand/README.md`](brand/README.md) cho logo và favicon.

## Bảo mật

Xem [`docs/BAO-MAT.md`](docs/BAO-MAT.md). Báo lỗ hổng theo [`SECURITY.md`](SECURITY.md),
**không mở issue công khai**.
