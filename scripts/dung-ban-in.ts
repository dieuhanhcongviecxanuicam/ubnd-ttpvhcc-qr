#!/usr/bin/env -S npx tsx
/**
 * Dựng ba bản in PDF (và ảnh xem trước) từ bản build tĩnh trong out/.
 *
 * Vì sao dựng sẵn thay vì để người dùng tự in từ trình duyệt: in trực tiếp
 * phụ thuộc hộp thoại in của từng máy - Chrome, Edge, Firefox mặc định không in
 * màu nền, tự thêm lề, tự co "vừa trang". Bảng niêm yết A1 mang ra tiệm in bạt
 * phải giống hệt nhau dù ai tải về. PDF dựng bằng cùng một Chromium, từ chính
 * trang HTML của site, cho kết quả như vậy.
 *
 * Script tự chặn ba lỗi âm thầm, dừng với mã lỗi nếu gặp:
 *   - Ảnh không tải được (mã QR thiếu tệp): PDF vẫn dựng xong, chỉ có ô trống.
 *   - Số trang lệch với dữ liệu: một nhóm hoặc lĩnh vực bị rơi khỏi bản in.
 *   - Route bản in trả lỗi.
 *
 * Cách dùng:
 *     npm run build && npx playwright install chromium && npm run dung-ban-in
 */
import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, stat } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { BAN_IN, tenTepAnh, tenTepPdf, THU_MUC_BAN_IN, type BanIn } from "../src/lib/ban-in.ts";

const GOC = process.cwd();
const THU_MUC_OUT = path.join(GOC, "out");
const THU_MUC_RA = path.join(THU_MUC_OUT, THU_MUC_BAN_IN.replace(/^\//, ""));

const KIEU: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

/**
 * URL -> tệp, mô phỏng cách GitHub Pages phân giải `/tthc/1.000110` ra
 * `tthc/1.000110.html`. Cùng cách với scripts/kiem-tra-tro-nang.mjs: đầu vào từ
 * URL chỉ dùng làm khoá tra, không bao giờ ghép thẳng vào đường dẫn tệp.
 */
async function lapBangTra(thuMuc: string, tienTo = ""): Promise<Map<string, string>> {
  const bang = new Map<string, string>();
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

function moMayChu(bang: Map<string, string>): Promise<Server> {
  const may = createServer((yeuCau, phanHoi) => {
    const khoa = decodeURIComponent((yeuCau.url ?? "").split("?")[0]).replace(/^\/+/, "");
    const tep = bang.get(khoa);
    if (tep === undefined) {
      phanHoi.writeHead(404).end("khong tim thay");
      return;
    }
    phanHoi.writeHead(200, { "content-type": KIEU[path.extname(tep)] ?? "application/octet-stream" });
    createReadStream(tep).pipe(phanHoi);
  });
  return new Promise((xong) => may.listen(0, "127.0.0.1", () => xong(may)));
}

/** Số trang mong đợi, tính thẳng từ dữ liệu chứ không lấy từ chính trang vừa dựng. */
async function soTrangMongDoi(): Promise<Record<BanIn["id"], number>> {
  const linhVuc: { slug: string }[] = JSON.parse(await readFile(path.join(GOC, "data/linh-vuc.json"), "utf-8"));
  const duLieuNhom: { nhom: { id: string }[]; linh_vuc: Record<string, string> } = JSON.parse(
    await readFile(path.join(GOC, "data/nhom-linh-vuc.json"), "utf-8"),
  );
  const coLinhVuc = new Set(linhVuc.map((lv) => duLieuNhom.linh_vuc[lv.slug] ?? "khac"));
  const soNhom = duLieuNhom.nhom.filter((n) => coLinhVuc.has(n.id)).length;
  return { "bang-niem-yet": 1, "to-nhom": soNhom, "tem-ma-qr": 1 + soNhom + linhVuc.length };
}

/** Đếm đối tượng trang trong PDF do Chromium xuất (từ điển trang không bị nén). */
function demTrang(pdf: Buffer): number {
  return (pdf.toString("latin1").match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
}

/**
 * Phần thực thi gói trong hàm vì tsx biên dịch .ts theo CommonJS (package.json
 * không khai báo type: module), mà CommonJS không có await ở cấp cao nhất.
 */
async function main(): Promise<void> {
  const mongDoi = await soTrangMongDoi();
  const may = await moMayChu(await lapBangTra(THU_MUC_OUT));
  const diaChi = may.address();
  const goc = `http://127.0.0.1:${typeof diaChi === "object" && diaChi ? diaChi.port : 0}`;
  await mkdir(THU_MUC_RA, { recursive: true });

  const trinhDuyet = await chromium.launch();
  const boiCanh = await trinhDuyet.newContext({ viewport: { width: 1440, height: 1000 } });
  const loi: string[] = [];

  console.log(`Dựng ${BAN_IN.length} bản in vào ${path.relative(GOC, THU_MUC_RA)}/`);
  for (const ban of BAN_IN) {
    const trang = await boiCanh.newPage();
    const taiNguyenHong: string[] = [];
    trang.on("response", (r) => {
      if (r.status() >= 400) taiNguyenHong.push(`${r.status()} ${new URL(r.url()).pathname}`);
    });

    const phanHoi = await trang.goto(`${goc}${ban.route}`, { waitUntil: "networkidle" });
    if (!phanHoi?.ok()) {
      loi.push(`${ban.route}: HTTP ${phanHoi?.status()}`);
      await trang.close();
      continue;
    }

    // Chờ bộ chữ và MỌI ảnh xong hẳn: PDF chụp lúc mã QR chưa kịp hiện vẫn "thành công".
    await trang.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((anh) =>
          anh.complete
            ? null
            : new Promise((xong) => {
                anh.addEventListener("load", xong, { once: true });
                anh.addEventListener("error", xong, { once: true });
              }),
        ),
      );
    });
    const anhHong = await trang.evaluate(() =>
      [...document.images].filter((anh) => anh.naturalWidth === 0).map((anh) => anh.getAttribute("src")),
    );
    if (anhHong.length) loi.push(`${ban.route}: ${anhHong.length} ảnh không tải được, ví dụ ${anhHong.slice(0, 3).join(", ")}`);
    if (taiNguyenHong.length) loi.push(`${ban.route}: tài nguyên lỗi ${taiNguyenHong.slice(0, 3).join(", ")}`);

    // Ảnh xem trước chụp ở chế độ màn hình, nơi thanh điều hướng dính của site
    // còn hiện và đè lên đầu tờ in. Ẩn nó đi để ảnh khớp với tệp PDF.
    await trang.addStyleTag({ content: ".header { display: none !important; }" });
    const tepAnh = path.join(THU_MUC_RA, tenTepAnh(ban));
    await trang.locator("article").first().screenshot({ path: tepAnh, type: "jpeg", quality: 82 });

    const tepPdf = path.join(THU_MUC_RA, tenTepPdf(ban));
    await trang.pdf({ path: tepPdf, printBackground: true, preferCSSPageSize: true });

    const soTrang = demTrang(await readFile(tepPdf));
    if (soTrang !== mongDoi[ban.id]) {
      loi.push(`${tenTepPdf(ban)}: ${soTrang} trang, mong đợi ${mongDoi[ban.id]}`);
    }
    const kb = (await stat(tepPdf)).size / 1024;
    const kbAnh = (await stat(tepAnh)).size / 1024;
    console.log(`  ${tenTepPdf(ban).padEnd(32)} ${String(soTrang).padStart(3)} trang  ${kb.toFixed(0).padStart(5)} KB   ảnh xem trước ${kbAnh.toFixed(0)} KB`);
    await trang.close();
  }

  await trinhDuyet.close();
  may.close();

  if (loi.length) {
    console.error(`\nBẢN IN: ${loi.length} lỗi`);
    for (const d of loi) console.error(`  - ${d}`);
    process.exit(1);
  }
  console.log("BẢN IN: đủ tệp, đủ trang, không ảnh nào hỏng.");
}

main().catch((loi) => {
  console.error("BẢN IN: dừng vì lỗi ngoài dự kiến\n", loi);
  process.exit(1);
});
