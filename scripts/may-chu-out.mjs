/**
 * Máy chủ tĩnh phục vụ thư mục out/ cho các script kiểm tra chạy trình duyệt
 * (kiem-tra-tro-nang.mjs, kiem-tra-giao-dien.mjs).
 *
 * Tách ra khi có script thứ hai cần nó: hai bản chép sớm muộn lệch nhau, mà chỗ
 * lệch ở đây là chỗ nguy hiểm - cách phân giải URL phải khớp GitHub Pages, và
 * lớp chống path traversal không được mất ở một bản.
 */
import { createReadStream } from "node:fs";
import { readdir } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const KIEU = {
  ".jpg": "image/jpeg",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

/**
 * Lập bảng tra: đường dẫn URL -> tệp thật, bằng cách duyệt out/ một lần lúc khởi
 * động.
 *
 * Bảng này phục vụ hai mục đích cùng lúc.
 *
 * Thứ nhất, nó mô phỏng đúng cách GitHub Pages phân giải URL: `/tthc/1.000110`
 * ra tệp `tthc/1.000110.html`. Không phải chi tiết vụn vặt - ở đường dẫn đó cả
 * thư mục lẫn tệp .html cùng tồn tại, và máy chủ tĩnh thông thường trả về danh
 * sách thư mục, khiến ta kiểm tra nhầm một trang gần như trống.
 *
 * Thứ hai, nó loại bỏ hẳn lớp lỗ hổng path traversal thay vì canh gác nó: đầu
 * vào từ URL chỉ được dùng làm KHOÁ TRA, không bao giờ chạm tới filesystem. Bản
 * trước ghép req.url vào đường dẫn rồi kiểm tra tiền tố, CodeQL vẫn cảnh báo
 * js/path-injection - và cảnh báo đó đúng về nguyên tắc: canh gác dễ hỏng khi
 * ai đó sửa sau này, còn không có đường dẫn nào để canh thì không hỏng được.
 */
export async function lapBangTra(thuMuc, tienTo = "") {
  const bang = new Map();
  for (const muc of await readdir(thuMuc, { withFileTypes: true })) {
    const tuyetDoi = path.join(thuMuc, muc.name);
    const khoa = tienTo ? `${tienTo}/${muc.name}` : muc.name;
    if (muc.isDirectory()) {
      for (const [k, v] of await lapBangTra(tuyetDoi, khoa)) bang.set(k, v);
      continue;
    }
    bang.set(khoa, tuyetDoi);
    if (muc.name === "index.html") bang.set(tienTo, tuyetDoi);
    else if (muc.name.endsWith(".html")) bang.set(khoa.slice(0, -".html".length), tuyetDoi);
  }
  return bang;
}

export function moMayChu(bang) {
  const may = createServer((req, res) => {
    const khoa = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
    const tep = bang.get(khoa);
    if (tep === undefined) {
      res.writeHead(404).end("khong tim thay");
      return;
    }
    res.writeHead(200, { "content-type": KIEU[path.extname(tep)] ?? "application/octet-stream" });
    createReadStream(tep).pipe(res);
  });
  return new Promise((ok) => may.listen(0, "127.0.0.1", () => ok(may)));
}


/** Mở máy chủ cho thư mục out/ trên cổng ngẫu nhiên, trả về máy chủ và địa chỉ gốc. */
export async function moMayChuOut(thuMuc = path.resolve(process.cwd(), "out")) {
  const may = await moMayChu(await lapBangTra(thuMuc));
  return { may, goc: `http://127.0.0.1:${may.address().port}` };
}
