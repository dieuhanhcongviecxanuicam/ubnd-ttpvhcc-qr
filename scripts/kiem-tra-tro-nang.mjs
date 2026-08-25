#!/usr/bin/env node
/**
 * Kiểm chứng trợ năng WCAG 2.1 AA trên thư mục out/ bằng axe-core.
 *
 * Vì sao cần: dự án từng sửa 117 vi phạm tương phản màu, nhưng con số "0 vi
 * phạm" sau đó chỉ là kết quả một lần chạy tay - không có gì canh giữ. Trợ năng
 * hỏng rất âm thầm: build vẫn xanh, test vẫn qua, trang vẫn hiển thị bình
 * thường với người sáng mắt. Đã gặp thực tế khi thử `content-visibility: auto`
 * để tối ưu hiệu năng: nó loại bốn tiêu đề mục khỏi cây trợ năng mà không một
 * bước CI nào phản ứng.
 *
 * Chạy trên trình duyệt thật chứ không phải jsdom, vì luật tương phản màu của
 * axe cần giá trị màu đã tính toán - thứ chỉ có khi trang được dựng thật.
 *
 * Cách dùng:
 *     npm run build && npm run kiem-tra-tro-nang
 *
 * Nếu Chromium báo thiếu libasound.so.2 (hay gặp trên WSL), xem
 * docs/HIEU-NANG.md mục 6 để biết cách nạp thư viện.
 */
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const THU_MUC = path.resolve(process.cwd(), "out");

/** Một trang cho mỗi loại bố cục - phủ hết template mà không phải quét cả 458 trang. */
const CAC_TRANG = [
  ["/", "trang chủ"],
  ["/danh-muc", "danh mục"],
  ["/linh-vuc/ho-tich", "lĩnh vực"],
  ["/tthc/1.000110", "chi tiết TTHC"],
  ["/in-ma-qr", "in mã QR"],
  ["/404", "trang 404"],
];

/**
 * Phục vụ out/ theo đúng cách GitHub Pages phân giải URL: ưu tiên `P.html` rồi
 * mới tới `P`. Đây không phải chi tiết vụn vặt - với /tthc/1.000110 thì cả thư
 * mục lẫn file .html cùng tồn tại, và máy chủ tĩnh thông thường trả về danh
 * sách thư mục, khiến ta kiểm tra nhầm một trang gần như trống.
 */
function moMayChu() {
  const KIEU = {
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
  // Chỉ chấp nhận đường dẫn nằm trong out/. Máy chủ này tuy chỉ chạy cục bộ và
  // trong CI, nhưng req.url do phía gọi kiểm soát nên `..` vẫn thoát ra ngoài
  // thư mục được - CodeQL bắt đúng (js/path-injection). Giải bằng resolve rồi
  // đối chiếu tiền tố, không phải bằng cách lọc chuỗi.
  const trongThuMuc = (p) => {
    const tuyetDoi = path.resolve(p);
    return tuyetDoi === THU_MUC || tuyetDoi.startsWith(THU_MUC + path.sep) ? tuyetDoi : null;
  };

  const may = createServer((req, res) => {
    const duongDan = decodeURIComponent(req.url.split("?")[0]).replace(/^\/+/, "");
    const goc = trongThuMuc(path.join(THU_MUC, duongDan));
    let tep = null;
    if (goc === null) {
      res.writeHead(403).end("ngoai pham vi");
      return;
    }
    if (duongDan === "") tep = trongThuMuc(path.join(THU_MUC, "index.html"));
    else if (fs.existsSync(`${goc}.html`)) tep = trongThuMuc(`${goc}.html`);
    else if (fs.existsSync(goc) && fs.statSync(goc).isFile()) tep = goc;
    else if (fs.existsSync(path.join(goc, "index.html"))) tep = trongThuMuc(path.join(goc, "index.html"));

    if (!tep) {
      res.writeHead(404).end("khong tim thay");
      return;
    }
    res.writeHead(200, { "content-type": KIEU[path.extname(tep)] ?? "application/octet-stream" });
    fs.createReadStream(tep).pipe(res);
  });
  return new Promise((ok) => may.listen(0, "127.0.0.1", () => ok(may)));
}

const may = await moMayChu();
const goc = `http://127.0.0.1:${may.address().port}`;
const nguonAxe = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");

const trinhDuyet = await chromium.launch();
// Khổ màn hình điện thoại: người dân đến với site này chủ yếu bằng cách quét mã
// QR tại quầy, nên bố cục mobile mới là bố cục cần bảo đảm.
const boiCanh = await trinhDuyet.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

// Nạp axe qua addInitScript chứ không phải addScriptTag: CSP của site cấm script
// nội tuyến không nằm trong danh sách băm, nên addScriptTag bị chặn thẳng. Đó là
// CSP đang làm đúng việc. addInitScript đi qua trình gỡ lỗi của trình duyệt nên
// không vướng CSP, mà cũng không phải nới lỏng chính sách chỉ để chạy được test.
await boiCanh.addInitScript({ content: nguonAxe });

const viPham = [];
let soTrang = 0;

for (const [duongDan, ten] of CAC_TRANG) {
  const trang = await boiCanh.newPage();
  const phanHoi = await trang.goto(`${goc}${duongDan}`, { waitUntil: "load" });
  if (!phanHoi || !phanHoi.ok()) {
    viPham.push({ ten, duongDan, id: "(tải trang)", moTa: `HTTP ${phanHoi?.status()}`, soNut: 0, nut: [] });
    await trang.close();
    continue;
  }
  soTrang += 1;
  const ketQua = await trang.evaluate(async () =>
    // Chỉ chạy bộ luật WCAG 2.1 mức A và AA - đúng mức dự án cam kết.
    window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] })
  );
  for (const v of ketQua.violations) {
    viPham.push({
      ten,
      duongDan,
      id: v.id,
      moTa: v.help,
      soNut: v.nodes.length,
      nut: v.nodes.slice(0, 3).map((n) => n.html.slice(0, 110)),
    });
  }
  await trang.close();
}

await trinhDuyet.close();
may.close();

if (viPham.length > 0) {
  const tongNut = viPham.reduce((t, v) => t + v.soNut, 0);
  console.error(`TRỢ NĂNG: ${viPham.length} loại vi phạm trên ${tongNut} phần tử, trong ${soTrang} trang:`);
  for (const v of viPham) {
    console.error(`  - [${v.ten}] ${v.id}: ${v.moTa} (${v.soNut} phần tử)`);
    for (const n of v.nut) console.error(`      ${n}`);
  }
  process.exit(1);
}

console.log(`TRỢ NĂNG: ${soTrang} trang, 0 vi phạm WCAG 2.1 AA.`);
