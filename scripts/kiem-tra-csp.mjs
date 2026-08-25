#!/usr/bin/env node
/**
 * Kiểm chứng CSP trong thư mục out/ trước khi phát hành.
 *
 * Bắt hai tình huống hỏng âm thầm:
 *   1. Trang thiếu hẳn thẻ meta CSP (script chèn bỏ sót).
 *   2. Băm trong chính sách không khớp script nội tuyến thực tế trên trang -
 *      trình duyệt sẽ chặn script và trang trắng, nhưng build vẫn "thành công".
 * Đồng thời chặn việc vô tình nới lỏng chính sách bằng 'unsafe-inline' hay
 * 'unsafe-eval' trong script-src.
 */
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const THU_MUC = path.join(process.cwd(), "out");
const RE_META = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/;
const RE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;

async function* duyetHtml(thuMuc) {
  for (const muc of await readdir(thuMuc, { withFileTypes: true })) {
    const p = path.join(thuMuc, muc.name);
    if (muc.isDirectory()) yield* duyetHtml(p);
    else if (muc.name.endsWith(".html")) yield p;
  }
}

const loi = [];
let soTrang = 0;

for await (const tep of duyetHtml(THU_MUC)) {
  soTrang += 1;
  const ten = path.relative(THU_MUC, tep);
  const html = await readFile(tep, "utf8");

  const khop = html.match(RE_META);
  if (!khop) {
    loi.push(`${ten}: thiếu thẻ meta Content-Security-Policy`);
    continue;
  }
  const chinhSach = khop[1];

  if (/script-src[^;]*'unsafe-(inline|eval)'/.test(chinhSach)) {
    loi.push(`${ten}: script-src bị nới lỏng bằng 'unsafe-inline' hoặc 'unsafe-eval'`);
  }

  // Bỏ chính thẻ meta ra khỏi nội dung trước khi dò script, tránh tự đối chiếu.
  const than = html.replace(RE_META, "");
  for (const m of than.matchAll(RE_SCRIPT)) {
    if (m[1].length === 0) continue;
    const bam = `'sha256-${createHash("sha256").update(m[1], "utf8").digest("base64")}'`;
    if (!chinhSach.includes(bam)) {
      loi.push(`${ten}: có script nội tuyến không nằm trong danh sách băm (${bam})`);
      break;
    }
  }
}

if (loi.length > 0) {
  console.error(`CSP: PHÁT HIỆN ${loi.length} vấn đề trên ${soTrang} trang:`);
  for (const d of loi.slice(0, 20)) console.error(`  - ${d}`);
  if (loi.length > 20) console.error(`  ... và ${loi.length - 20} vấn đề khác`);
  process.exit(1);
}

console.log(`CSP: ${soTrang} trang đều có chính sách hợp lệ, mọi script nội tuyến đã được băm.`);
