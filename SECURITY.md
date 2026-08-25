# Chính sách bảo mật

## Phạm vi

Tài liệu này áp dụng cho hệ thống tra cứu thủ tục hành chính qua mã QR tại
**https://ttpvhcc.xanuicam.vn** và kho mã nguồn của hệ thống.

## Báo cáo lỗ hổng

Nếu bạn phát hiện lỗ hổng bảo mật, **xin đừng mở issue công khai**. Việc công bố
trước khi kịp vá có thể khiến người dân bị lợi dụng.

Cách báo cáo:

1. Dùng chức năng [Report a vulnerability](https://github.com/dieuhanhcongviecxanuicam/ubnd-ttpvhcc-qr/security/advisories/new)
   của GitHub - đây là kênh riêng tư, chỉ người quản trị kho mã đọc được.
2. Hoặc liên hệ trực tiếp Giám đốc Trung tâm Phục vụ hành chính công xã Núi Cấm.

Xin nêu rõ: đường dẫn hoặc tệp liên quan, các bước tái hiện, và tác động bạn đánh
giá được. Ảnh chụp màn hình rất hữu ích.

## Cam kết xử lý

| Mốc | Thời hạn |
|---|---|
| Xác nhận đã nhận báo cáo | Trong 3 ngày làm việc |
| Đánh giá và phản hồi hướng xử lý | Trong 7 ngày làm việc |
| Vá lỗ hổng mức cao | Sớm nhất có thể, ưu tiên trước mọi việc khác |

Chúng tôi ghi nhận công lao của người báo cáo trong phần công bố sau khi đã vá,
trừ khi bạn muốn ẩn danh.

## Những gì KHÔNG thuộc phạm vi

Hệ thống là website tĩnh: không có máy chủ ứng dụng, không cơ sở dữ liệu, không
đăng nhập, không nhận và lưu bất kỳ dữ liệu nào từ người dùng. Các báo cáo sau
thường không áp dụng được:

- Thiếu header bảo mật mà trình duyệt bỏ qua khi đặt trong thẻ `meta`
- Tấn công brute-force hoặc chiếm phiên (hệ thống không có tài khoản người dùng)
- Kết quả quét tự động chưa được kiểm chứng thủ công
- Tấn công từ chối dịch vụ

## Dữ liệu

Dữ liệu thủ tục hành chính trên hệ thống là **thông tin công khai** lấy từ Cổng
Dịch vụ công Quốc gia. Hệ thống không thu thập dữ liệu cá nhân, không dùng cookie
và không cài công cụ đo lượt truy cập.
