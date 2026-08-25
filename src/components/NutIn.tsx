"use client";

/** Nút gọi hộp thoại in của trình duyệt — chỉ hiện trên màn hình, ẩn khi in. */
export default function NutIn() {
  return (
    <button type="button" className="btn-taixuong" onClick={() => window.print()}>
      In trang này
    </button>
  );
}
