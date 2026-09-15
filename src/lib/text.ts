/**
 * Tiện ích xử lý chuỗi tiếng Việt - dùng chung giữa build-time và client.
 */

/**
 * Bỏ dấu tiếng Việt và chuyển về chữ thường, để người dân gõ "ho tich"
 * vẫn tìm được "Hộ tịch".
 */
export function boDau(chuoi: string | null | undefined): string {
  return (chuoi ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

/** Chuyển tên tiếng Việt thành slug URL - khớp với slugify() trong pipeline Python. */
export function taoSlug(chuoi: string): string {
  return boDau(chuoi)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Bỏ dấu nhưng ghi lại vị trí từng ký tự trong chuỗi GỐC.
 *
 * Cần thiết cho việc tô sáng từ khoá: người dân gõ "ho tich" không dấu, nhưng
 * phần được tô phải là "Hộ tịch" nguyên bản có dấu. Muốn vậy phải biết ký tự
 * thứ i của chuỗi đã bỏ dấu tương ứng với ký tự nào của chuỗi gốc.
 */
export function chuanHoaCoViTri(chuoi: string): {
  chuan: string;
  viTri: number[];
} {
  let chuan = "";
  const viTri: number[] = [];

  for (let i = 0; i < chuoi.length; i++) {
    let co_ban = chuoi[i]
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    if (co_ban === "đ") co_ban = "d";

    for (const c of co_ban) {
      chuan += c;
      viTri.push(i);
    }
  }
  return { chuan, viTri };
}

/** Một đoạn khớp từ khoá, tính theo chỉ số của chuỗi gốc. */
export interface DoanKhop {
  batDau: number;
  ketThuc: number;
}

/**
 * Tìm mọi đoạn trong `chuoi` khớp với `tuKhoa`, bỏ qua dấu và hoa thường.
 * Trả về chỉ số theo chuỗi gốc để cắt ra tô sáng.
 */
export function timDoanKhop(chuoi: string, tuKhoa: string): DoanKhop[] {
  const tim = boDau(tuKhoa.trim());
  if (!tim) return [];

  const { chuan, viTri } = chuanHoaCoViTri(chuoi);
  const ket_qua: DoanKhop[] = [];

  let tu = chuan.indexOf(tim);
  while (tu !== -1) {
    const cuoi = tu + tim.length - 1;
    ket_qua.push({ batDau: viTri[tu], ketThuc: viTri[cuoi] + 1 });
    tu = chuan.indexOf(tim, tu + tim.length);
  }
  return ket_qua;
}

/**
 * Rút gọn tên thủ tục để in trong danh sách tóm tắt trên thẻ lĩnh vực.
 *
 * Dữ liệu nguồn không thống nhất: một số tên mở đầu bằng "Thủ tục ..." còn phần
 * lớn thì không. Xếp cạnh nhau trong cùng một danh sách đánh số, chữ "Thủ tục"
 * lặp lại chỉ chiếm chỗ mà không thêm thông tin - nhất là khi mỗi dòng chỉ hiện
 * được hai dòng chữ. Bỏ tiền tố rồi viết hoa lại chữ đầu để danh sách đều nhau.
 */
export function rutGonTenTthc(ten: string): string {
  const con = (ten ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^thủ tục\s+/i, "");
  return con ? con[0].toLocaleUpperCase("vi-VN") + con.slice(1) : con;
}

/**
 * Cắt chuỗi về tối đa `toiDa` ký tự, cắt ở ranh giới từ và thêm dấu ba chấm.
 *
 * Dùng cho danh sách thủ tục tiêu biểu trên thẻ lĩnh vực: tên thủ tục dài nhất
 * trong dữ liệu là 409 ký tự, để nguyên thì một thẻ cao gấp ba thẻ bên cạnh.
 * Cắt ở tầng dữ liệu chứ không bằng `-webkit-line-clamp`: thuộc tính đó buộc
 * phần tử về `display: -webkit-box`, và hộp đó nuốt mất số thứ tự của thẻ `<li>`.
 */
export function catNgan(chuoi: string, toiDa: number): string {
  const s = (chuoi ?? "").trim();
  if (s.length <= toiDa) return s;
  const cat = s.slice(0, toiDa);
  const khoangTrang = cat.lastIndexOf(" ");
  return `${(khoangTrang > toiDa * 0.6 ? cat.slice(0, khoangTrang) : cat).replace(/[,;.\s]+$/, "")}…`;
}
