# ubnd-ttpvhcc-qr

**Hệ thống tra cứu thủ tục hành chính qua mã QR** - Trung tâm Phục vụ hành chính công.

🌐 **https://ttpvhcc.xanuicam.vn**

[![Kiểm tra chất lượng](https://github.com/dieuhanhcongviecxanuicam/ubnd-ttpvhcc-qr/actions/workflows/ci.yml/badge.svg)](https://github.com/dieuhanhcongviecxanuicam/ubnd-ttpvhcc-qr/actions/workflows/ci.yml)
[![Triển khai GitHub Pages](https://github.com/dieuhanhcongviecxanuicam/ubnd-ttpvhcc-qr/actions/workflows/deploy.yml/badge.svg)](https://github.com/dieuhanhcongviecxanuicam/ubnd-ttpvhcc-qr/actions/workflows/deploy.yml)

Người dân quét mã QR dán tại quầy một cửa để mở ngay danh sách thủ tục của đúng
lĩnh vực cần làm, xem trình tự, hồ sơ, lệ phí, căn cứ pháp lý, rồi chuyển thẳng
sang Cổng Dịch vụ công Quốc gia để nộp trực tuyến.

- **376** thủ tục hành chính · **77** lĩnh vực · **78** mã QR
- Website tĩnh (Next.js static export) - không cần server, không cần cơ sở dữ liệu
- Toàn bộ 455 trang được sinh sẵn lúc build → mở tức thì trên điện thoại, tốt cho SEO

---

## 1. Bắt đầu nhanh

```bash
npm install          # cài phụ thuộc
npm run dev          # chạy máy chủ phát triển tại http://localhost:3000
```

Build bản triển khai:

```bash
npm run build        # xuất trang tĩnh vào thư mục out/
npm start            # xem thử bản đã build
```

> Hệ thống chạy trên tên miền riêng `ttpvhcc.xanuicam.vn` phục vụ từ gốc, nên
> không cần cấu hình thêm gì. Nếu muốn tạm triển khai lên GitHub Pages dạng
> đường dẫn con thì đặt `NEXT_PUBLIC_BASE_PATH=/ubnd-ttpvhcc-qr` khi build.

## 2. Cấu trúc dự án

```
ubnd-ttpvhcc-qr/
├── data/                        # Dữ liệu JSON - đọc lúc build, không gửi xuống trình duyệt
│   ├── tthc.json                #   376 TTHC kèm các bảng con (5,3 MB)
│   ├── linh-vuc.json            #   77 lĩnh vực: tên, slug, danh sách mã TTHC
│   ├── meta.json                #   Số liệu tổng hợp hiển thị trên site
│   └── source/                  #   File Excel nguồn (không đưa lên Git)
├── brand/                       # logo-ttpvhcc.png - file gốc duy nhất (xem brand/README.md)
├── public/
│   ├── CNAME                    # Tên miền riêng - bắt buộc cho GitHub Pages
│   ├── favicon.ico              # Biểu tượng trình duyệt
│   ├── brand/                   # Logo, favicon, icon PWA website phục vụ
│   └── qr/                      # 78 mã QR × 2 định dạng (PNG in ấn, SVG web)
├── scripts/                     # Pipeline dữ liệu bằng Python
│   ├── trich-xuat-du-lieu.py    #   Excel  → data/*.json
│   ├── tao-ma-qr.py             #   JSON   → public/qr/*
│   └── kiem-tra-ma-qr.py        #   Giải mã ngược QR (zxing), đối chiếu URL
├── src/
│   ├── app/                     # Route (App Router)
│   │   ├── page.tsx             #   /                     trang chủ + QR tổng
│   │   ├── danh-muc/            #   /danh-muc             tra cứu toàn bộ danh mục
│   │   ├── linh-vuc/[slug]/     #   /linh-vuc/<slug>      77 trang - ĐÍCH CỦA MÃ QR
│   │   ├── tthc/[ma]/           #   /tthc/<mã>            376 trang chi tiết
│   │   ├── in-ma-qr/            #   /in-ma-qr             bảng in A4 toàn bộ mã QR
│   │   └── globals.css          #   Hệ thống thiết kế "Dấu son & Mã QR"
│   ├── components/              # Thành phần giao diện dùng lại
│   └── lib/                     # Truy xuất dữ liệu, cấu hình, tiện ích chuỗi
└── .github/workflows/           # CI (typecheck/lint/build + kiểm tra QR) và deploy
```

## 3. Quy trình cập nhật khi danh mục TTHC thay đổi

```bash
# 1. Đặt file Excel mới vào data/source/
python3 scripts/trich-xuat-du-lieu.py        # sinh lại data/*.json
python3 scripts/tao-ma-qr.py                 # sinh lại toàn bộ mã QR
python3 scripts/kiem-tra-ma-qr.py            # xác nhận QR trỏ đúng
git commit -am "Cập nhật danh mục TTHC" && git push   # CI tự triển khai
```

Không cần sửa mã nguồn - số liệu, danh sách lĩnh vực và các trang chi tiết đều
sinh ra từ `data/`.

Chuẩn bị môi trường Python một lần:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r scripts/requirements-dev.txt
```

## 4. Đổi sang tên miền chính thức

Địa chỉ đích được **nhúng cứng vào ảnh QR** lúc sinh, nên đổi tên miền là phải
sinh lại toàn bộ mã QR rồi in lại:

```bash
python3 scripts/tao-ma-qr.py      --base-url https://ten-mien-moi.gov.vn
python3 scripts/kiem-tra-ma-qr.py --base-url https://ten-mien-moi.gov.vn
```

Sau đó sửa `public/CNAME` thành tên miền mới, cập nhật `SITE_ORIGIN` trong
`src/lib/site-config.ts`, rồi trỏ DNS về GitHub Pages.

Chi tiết vận hành: xem [`docs/VAN-HANH.md`](docs/VAN-HANH.md). Số liệu hiệu năng
cơ sở đo bằng Lighthouse: [`docs/HIEU-NANG.md`](docs/HIEU-NANG.md).

## 5. Lệnh có sẵn

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Máy chủ phát triển |
| `npm run build` | Xuất trang tĩnh vào `out/` |
| `npm start` | Xem thử bản đã build |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Chạy test |
| `npm run kiem-tra` | Typecheck, lint và test - chạy trước mỗi lần đẩy mã |
| `npm run du-lieu:lam-moi` | Trích xuất lại dữ liệu và sinh lại mã QR |
| `npm run kiem-tra-qr` | Đối chiếu nội dung mã QR với route thật |
| `npm run kiem-tra-csp` | Kiểm chứng Content-Security-Policy của bản build |
| `python3 scripts/tao-bo-nhan-dien.py` | Sinh lại logo, favicon, icon PWA từ file gốc |

## 6. Ghi chú kỹ thuật

**Vì sao pre-render toàn bộ.** Bản MVP trước tải cả `tthc.json` (5,3 MB) trên mọi
trang rồi mới dựng nội dung bằng JavaScript. Nay dữ liệu chỉ được đọc lúc build;
trình duyệt nhận HTML đã có sẵn nội dung - 36-204 KB mỗi trang thay vì 5,3 MB.
Điều này quan trọng vì phần lớn người dùng quét QR bằng điện thoại dùng mạng di động.

**Vì sao cần `kiem-tra-ma-qr.py`.** Mã QR một khi đã in và dán tại quầy thì không
sửa được. Script này giải mã ngược từng ảnh QR và đối chiếu với đường dẫn website
thực sự phục vụ, chạy tự động trong CI mỗi lần đẩy mã lên. Script dùng **zxing-cpp**
chứ không dùng OpenCV: bộ giải mã của OpenCV đọc hụt mã QR từ version 5 trở lên
(gặp thực tế với các lĩnh vực có slug dài) và sẽ báo lỗi giả.

**Font.** Lora + Inter + IBM Plex Mono được tự host lúc build (`next/font`) thay vì
gọi Google Fonts lúc chạy, nên trang hiển thị đúng cả trong mạng nội bộ không có Internet.

**Nhận diện thương hiệu.** Toàn bộ logo, favicon và icon PWA sinh ra từ một file
gốc `brand/logo-ttpvhcc.png` bằng `scripts/tao-bo-nhan-dien.py`. Trang có khai báo
`manifest.webmanifest` nên cán bộ một cửa thêm được vào màn hình chính điện thoại
và mở như ứng dụng.

**URL không có dấu "/" ở cuối.** Next xuất ra tệp `/<route>.html` và GitHub Pages
phục vụ tệp đó cho đường dẫn không đuôi - đã kiểm chứng trả 200 và không chuyển
hướng, kể cả đường dẫn chứa dấu chấm như `/tthc/1.000288`.

**Mã QR màu đen tuyền** trên nền trắng: tương phản cao nhất nên máy quét đọc chắc
hơn, kể cả khi bản in phai màu hoặc quầy thiếu sáng.

**Trợ năng.** Kiểm định bằng axe-core theo WCAG 2.1 AA: **0 vi phạm** trên 8 trang,
ở cả khung điện thoại và máy tính. Mọi màu chữ đạt tối thiểu 4.96:1.

**Test.** Dùng bộ chạy test có sẵn của Node, không thêm framework. Đáng chú ý nhất
là nhóm bất biến dữ liệu trong `tests/du-lieu.test.ts`: đối chiếu `so_luong_tthc`
với số mã giải được trong `danh_sach_ma_tthc`. Đây chính là lớp lỗi từng lọt ra
production, khi trang lĩnh vực hiển thị "7 thủ tục" nhưng danh sách trống.

**Đóng góp.** Nhánh `main` được bảo vệ, mọi thay đổi đi qua pull request - xem
[`CONTRIBUTING.md`](CONTRIBUTING.md).

**Bảo mật.** Chính sách CSP được sinh tự động sau mỗi lần build, băm SHA-256 từng
khối script nội tuyến nên không cần `'unsafe-inline'`. GitHub Action ghim theo
commit SHA. Chi tiết vận hành và phần cấu hình Cloudflare: [`docs/BAO-MAT.md`](docs/BAO-MAT.md).
Báo lỗ hổng: [`SECURITY.md`](SECURITY.md).

**Nguồn dữ liệu.** [Cổng Dịch vụ công Quốc gia](https://dichvucong.gov.vn) - dữ liệu
thủ tục hành chính là thông tin công khai.

## 7. Hạ tầng

| Thành phần | Cấu hình |
|---|---|
| Kho mã nguồn | `github.com/dieuhanhcongviecxanuicam/ubnd-ttpvhcc-qr` |
| Hosting | GitHub Pages, triển khai bằng GitHub Actions |
| Tên miền | `ttpvhcc.xanuicam.vn` |
| DNS | Cloudflare - `CNAME ttpvhcc → dieuhanhcongviecxanuicam.github.io`, chế độ **DNS only** (không bật proxy) |
| HTTPS | Chứng chỉ Let's Encrypt do GitHub Pages tự cấp và tự gia hạn |

> Để bản ghi DNS ở chế độ **DNS only**. Bật proxy của Cloudflare sẽ chặn GitHub
> xác thực tên miền nên không cấp được chứng chỉ, dễ gây vòng lặp chuyển hướng.

## 8. Giấy phép

[MIT](LICENSE) - mã nguồn. Dữ liệu thủ tục hành chính thuộc về cơ quan nhà nước
có thẩm quyền công bố.
