import { timDoanKhop } from "@/lib/text";

/**
 * Hiển thị một chuỗi, tô sáng phần khớp với từ khoá đang gõ.
 * So khớp bỏ dấu nên gõ "ho tich" vẫn tô đúng chữ "Hộ tịch".
 */
export default function ChuKhop({
  chuoi,
  tuKhoa,
}: {
  chuoi: string;
  tuKhoa: string;
}) {
  const doan = timDoanKhop(chuoi, tuKhoa);
  if (doan.length === 0) return <>{chuoi}</>;

  const phan: React.ReactNode[] = [];
  let vi_tri = 0;

  doan.forEach((d, i) => {
    if (d.batDau > vi_tri) phan.push(chuoi.slice(vi_tri, d.batDau));
    phan.push(<mark key={i}>{chuoi.slice(d.batDau, d.ketThuc)}</mark>);
    vi_tri = d.ketThuc;
  });
  if (vi_tri < chuoi.length) phan.push(chuoi.slice(vi_tri));

  return <>{phan}</>;
}
