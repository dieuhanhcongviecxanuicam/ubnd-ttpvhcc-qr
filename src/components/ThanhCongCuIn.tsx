"use client";

type CheDoIn = "tat-ca" | "tung-ma";

/**
 * Hai chế độ in cho bảng mã QR:
 * - "tat-ca": xếp lưới nhiều mã trên một trang, tiết kiệm giấy khi cần bảng tra.
 * - "tung-ma": mỗi mã QR chiếm trọn một trang giấy, dùng khi in ra để dán từng
 *   quầy. Khổ giấy do người dùng chọn trong hộp thoại in, bố cục tự co theo.
 *
 * Chế độ được đánh dấu bằng thuộc tính trên thẻ <html> để CSS in đọc được, và
 * gỡ bỏ ngay sau khi hộp thoại in đóng lại.
 */
export default function ThanhCongCuIn() {
  function in_trang(cheDo: CheDoIn) {
    const goc = document.documentElement;
    goc.dataset.cheDoIn = cheDo;

    const don_dep = () => {
      delete goc.dataset.cheDoIn;
      window.removeEventListener("afterprint", don_dep);
    };
    window.addEventListener("afterprint", don_dep);

    window.print();
  }

  return (
    <div className="nhom-nut-in">
      <button
        type="button"
        className="btn-taixuong btn-phu"
        onClick={() => in_trang("tung-ma")}
      >
        In từng mã
      </button>
      <button
        type="button"
        className="btn-taixuong"
        onClick={() => in_trang("tat-ca")}
      >
        In trang này
      </button>
    </div>
  );
}
