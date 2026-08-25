import Link from "next/link";

export default function KhongTimThay() {
  return (
    <main className="container" id="noi-dung">
      <div className="khong-co-ket-qua">
        <h1>Không tìm thấy trang</h1>
        <p>
          Địa chỉ bạn truy cập không tồn tại hoặc thủ tục đã được thay đổi mã.
        </p>
        <div className="hang-nut" style={{ justifyContent: "center" }}>
          <Link href="/" className="btn-taixuong">
            Về trang chủ
          </Link>
          <Link href="/danh-muc/" className="btn-taixuong btn-phu">
            Tra cứu danh mục
          </Link>
        </div>
      </div>
    </main>
  );
}
