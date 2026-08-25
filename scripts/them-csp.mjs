#!/usr/bin/env node
/**
 * Chèn Content-Security-Policy vào từng trang HTML sau khi build.
 *
 * GitHub Pages không cho đặt header HTTP tuỳ ý, nên CSP phải đi trong thẻ
 * <meta http-equiv>. Next sinh vài khối <script> nội tuyến chứa dữ liệu render;
 * thay vì nới lỏng bằng 'unsafe-inline', script này băm SHA-256 từng khối và
 * liệt kê băm vào script-src. Mỗi trang có bộ băm riêng nên chính sách vẫn chặt.
 *
 * Hai directive KHÔNG đặt ở đây vì trình duyệt bỏ qua khi chúng nằm trong thẻ
 * meta - phải đặt bằng header ở tầng Cloudflare (xem docs/BAO-MAT.md):
 *   frame-ancestors, report-uri
 */
import { createHash } from "node:crypto";
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const THU_MUC = path.join(process.cwd(), "out");

/** Các directive không phụ thuộc nội dung trang. */
const CO_DINH = [
  "default-src 'self'",
  // Ảnh QR và logo là tệp cùng miền; data: dành cho biểu tượng SVG nhúng trong CSS.
  "img-src 'self' data:",
  // Thuộc tính style= nội tuyến do next/image sinh ra không băm được.
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "base-uri 'none'",
  // Trang không gửi biểu mẫu đi đâu; ô tìm kiếm điều hướng bằng JavaScript.
  "form-action 'none'",
  "upgrade-insecure-requests",
];

async function* duyetHtml(thuMuc) {
  for (const muc of await readdir(thuMuc, { withFileTypes: true })) {
    const duongDan = path.join(thuMuc, muc.name);
    if (muc.isDirectory()) yield* duyetHtml(duongDan);
    else if (muc.name.endsWith(".html")) yield duongDan;
  }
}

/** Băm nội dung mọi thẻ <script> không có thuộc tính src. */
function bamScriptNoiTuyen(html) {
  const bam = new Set();
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let khop;
  while ((khop = re.exec(html)) !== null) {
    const noiDung = khop[1];
    if (noiDung.length === 0) continue;
    bam.add(
      `'sha256-${createHash("sha256").update(noiDung, "utf8").digest("base64")}'`,
    );
  }
  return [...bam];
}

function dungChinhSach(bam) {
  const scriptSrc = ["script-src 'self'", ...bam].join(" ");
  return [...CO_DINH, scriptSrc].join("; ");
}

const CHEN_SAU = "<head>";

async function main() {
  let soTrang = 0;
  let tongBam = 0;

  for await (const tep of duyetHtml(THU_MUC)) {
    const html = await readFile(tep, "utf8");
    if (!html.includes(CHEN_SAU)) {
      console.error(
        `LỖI: không tìm thấy <head> trong ${path.relative(THU_MUC, tep)}`,
      );
      process.exitCode = 1;
      continue;
    }
    if (html.includes('http-equiv="Content-Security-Policy"')) continue;

    const bam = bamScriptNoiTuyen(html);
    tongBam += bam.length;
    const the = `<meta http-equiv="Content-Security-Policy" content="${dungChinhSach(bam)}">`;
    await writeFile(tep, html.replace(CHEN_SAU, `${CHEN_SAU}${the}`), "utf8");
    soTrang += 1;
  }

  console.log(
    `CSP: đã chèn vào ${soTrang} trang, băm ${tongBam} khối script nội tuyến.`,
  );
}

await main();
