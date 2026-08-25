# ubnd-ttpvhcc-qr

**Hệ thống tra cứu thủ tục hành chính qua mã QR** — Trung tâm Phục vụ hành chính công.

Người dân quét mã QR dán tại quầy một cửa để mở ngay danh sách thủ tục của đúng
lĩnh vực cần làm, xem trình tự, hồ sơ, lệ phí, căn cứ pháp lý, rồi chuyển thẳng
sang Cổng Dịch vụ công Quốc gia để nộp trực tuyến.

- **376** thủ tục hành chính · **77** lĩnh vực · **78** mã QR
- Website tĩnh (Next.js static export) — không cần server, không cần cơ sở dữ liệu
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

> **Lưu ý khi build cho GitHub Pages:** trang nằm dưới đường dẫn con
> `/ubnd-ttpvhcc-qr` nên phải đặt biến môi trường:
> ```bash
> NEXT_PUBLIC_BASE_PATH=/ubnd-ttpvhcc-qr npm run build
> ```
> Workflow CI/CD đã tự làm việc này, chỉ cần khi build thủ công.

## 2. Cấu trúc dự án

```
ubnd-ttpvhcc-qr/
├── data/                        # Dữ liệu JSON — đọc lúc build, không gửi xuống trình duyệt
│   ├── tthc.json                #   376 TTHC kèm các bảng con (5,3 MB)
│   ├── linh-vuc.json            #   77 lĩnh vực: tên, slug, danh sách mã TTHC
│   ├── meta.json                #   Số liệu tổng hợp hiển thị trên site
│   └── source/                  #   File Excel nguồn (không đưa lên Git)
├── public/qr/                   # 78 mã QR × 2 định dạng (PNG in ấn, SVG web)
├── scripts/                     # Pipeline dữ liệu bằng Python
│   ├── trich-xuat-du-lieu.py    #   Excel  → data/*.json
│   ├── tao-ma-qr.py             #   JSON   → public/qr/*
│   └── kiem-tra-ma-qr.py        #   Giải mã ngược QR, đối chiếu URL
├── src/
│   ├── app/                     # Route (App Router)
│   │   ├── page.tsx             #   /                     trang chủ + QR tổng
│   │   ├── danh-muc/            #   /danh-muc/            tra cứu toàn bộ danh mục
│   │   ├── linh-vuc/[slug]/     #   /linh-vuc/<slug>/     77 trang — ĐÍCH CỦA MÃ QR
│   │   ├── tthc/[ma]/           #   /tthc/<mã>/           376 trang chi tiết
│   │   ├── in-ma-qr/            #   /in-ma-qr/            bảng in A4 toàn bộ mã QR
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

Không cần sửa mã nguồn — số liệu, danh sách lĩnh vực và các trang chi tiết đều
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
python3 scripts/tao-ma-qr.py --base-url https://tthc.donvi.gov.vn
python3 scripts/kiem-tra-ma-qr.py --base-url https://tthc.donvi.gov.vn
```

Đồng thời đặt biến môi trường khi build (bỏ `NEXT_PUBLIC_BASE_PATH` vì tên miền
riêng phục vụ ở gốc):

```bash
NEXT_PUBLIC_SITE_ORIGIN=https://tthc.donvi.gov.vn npm run build
```

Chi tiết vận hành: xem [`docs/VAN-HANH.md`](docs/VAN-HANH.md).

## 5. Lệnh có sẵn

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Máy chủ phát triển |
| `npm run build` | Xuất trang tĩnh vào `out/` |
| `npm start` | Xem thử bản đã build |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run lint` | ESLint |
| `npm run kiem-tra` | Chạy cả typecheck và lint |
| `npm run du-lieu:lam-moi` | Trích xuất lại dữ liệu và sinh lại mã QR |
| `npm run kiem-tra-qr` | Đối chiếu nội dung mã QR với route thật |

## 6. Ghi chú kỹ thuật

**Vì sao pre-render toàn bộ.** Bản MVP trước tải cả `tthc.json` (5,3 MB) trên mọi
trang rồi mới dựng nội dung bằng JavaScript. Nay dữ liệu chỉ được đọc lúc build;
trình duyệt nhận HTML đã có sẵn nội dung — 36–204 KB mỗi trang thay vì 5,3 MB.
Điều này quan trọng vì phần lớn người dùng quét QR bằng điện thoại dùng mạng di động.

**Vì sao cần `kiem-tra-ma-qr.py`.** Mã QR một khi đã in và dán tại quầy thì không
sửa được. Script này giải mã ngược từng ảnh QR và đối chiếu với đường dẫn website
thực sự phục vụ, chạy tự động trong CI mỗi lần đẩy mã lên.

**Font.** Lora + Inter + IBM Plex Mono được tự host lúc build (`next/font`) thay vì
gọi Google Fonts lúc chạy, nên trang hiển thị đúng cả trong mạng nội bộ không có Internet.

**Nguồn dữ liệu.** [Cổng Dịch vụ công Quốc gia](https://dichvucong.gov.vn) — dữ liệu
thủ tục hành chính là thông tin công khai.

## 7. Giấy phép

[MIT](LICENSE) — mã nguồn. Dữ liệu thủ tục hành chính thuộc về cơ quan nhà nước
có thẩm quyền công bố.
