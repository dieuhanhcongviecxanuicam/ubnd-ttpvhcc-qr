/**
 * Biểu tượng tai nghe tổng đài cho khối "Hỗ trợ, hướng dẫn" ở chân bảng niêm yết.
 *
 * Vẽ bằng SVG nội tuyến để in ra vẫn là vector. Dùng tai nghe thay ống nghe điện
 * thoại: ống nghe quay số là hình ảnh của máy bàn đời cũ, còn tai nghe là dấu
 * hiệu quen thuộc của bộ phận hướng dẫn, và ở cỡ nhỏ vẫn nhận ra ngay nhờ khối
 * đặc hai bên.
 */
export function IconHoTro() {
  return (
    <svg viewBox="0 0 24 24" fill="none" focusable="false" aria-hidden="true">
      <path
        d="M4 14.5v-2.5a8 8 0 0 1 16 0v2.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <rect x="1.8" y="13" width="5.2" height="7.4" rx="2.6" fill="currentColor" />
      <rect x="17" y="13" width="5.2" height="7.4" rx="2.6" fill="currentColor" />
      <path
        d="M19.6 20.4v.6a2.6 2.6 0 0 1-2.6 2.6h-3.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
