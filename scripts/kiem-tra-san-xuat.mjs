#!/usr/bin/env node
/**
 * Đối chiếu nội dung site thật đang phục vụ với bản vừa build trong out/.
 *
 * Vì sao cần: CI hiện canh mọi thứ TRƯỚC khi phát hành - CSP, trợ năng, mã QR,
 * phiên bản. Không bước nào nhìn vào thứ người dân thật sự nhận được. Giữa hai
 * chỗ đó còn một lớp nữa: Cloudflare, và lớp này CÓ sửa nội dung.
 *
 * Đã xảy ra thật, 16/09/2026: tính năng Bot Preference Sync chèn 61 dòng vào
 * đầu robots.txt, gồm cả một tuyên bố pháp lý viện dẫn Điều 4 Chỉ thị 2019/790
 * của EU - nội dung UBND xã không soạn và không duyệt. Kho mã vẫn 5 dòng, CI
 * vẫn xanh, build vẫn đúng. Phát hiện được chỉ vì tình cờ curl tay.
 *
 * LẤY NHIỀU MẪU, KHÔNG LẤY MỘT. Cũng hôm đó, sau khi tắt công tắc, 20 lượt gọi
 * liên tiếp trả về 4 lượt bản mới và 16 lượt bản cũ - mỗi request rơi vào một
 * nút edge có trạng thái khác nhau. Một mẫu đơn lẻ vì thế vừa báo động giả được
 * (trúng nút chưa cập nhật) vừa bỏ lọt được (trúng nút đã sạch). Script lấy
 * SO_MAU mẫu cho mỗi tệp và báo cả tỉ lệ, để phân biệt "hỏng" với "đang lan".
 *
 * Cách dùng:
 *     npm run build && npm run kiem-tra-san-xuat
 *     node scripts/kiem-tra-san-xuat.mjs --goc https://ttpvhcc.xanuicam.vn
 *
 * Mã thoát 1 khi nội dung phục vụ khác bản trong kho. Các sai lệch đã biết và
 * đã chấp nhận (xem BIET_TRUOC) chỉ cảnh báo, không làm đỏ CI.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

const THU_MUC = path.join(process.cwd(), "out");
const SO_MAU = Number(process.env.SO_MAU ?? 5);

/** Đọc tên miền từ public/CNAME - cùng nguồn sự thật mà script Cloudflare dùng. */
async function gocMacDinh() {
  const mien = (await readFile(path.join(process.cwd(), "public", "CNAME"), "utf8")).trim();
  return `https://${mien}`;
}

const doiSo = process.argv.indexOf("--goc");
const GOC = doiSo !== -1 ? process.argv[doiSo + 1] : await gocMacDinh();

/**
 * Tệp phải khớp giữa out/ và site thật, kèm hàm chuẩn hoá trước khi so.
 *
 * Vì sao cần chuẩn hoá: build của dự án KHÔNG tất định (xem docs, hai lần build
 * cùng một commit từng lệch 914 băm). Bản out/ trên máy người chạy script gần
 * như chắc chắn không phải bản đã phát hành. So từng byte những phần sinh theo
 * lần build vì thế báo động giả mỗi lần chạy, và một kiểm tra hay kêu oan thì
 * chẳng ai còn đọc. Chỉ so phần thật sự cố định trong kho mã.
 */
const TEP_DOI_CHIEU = [
  ["/robots.txt", "robots.txt", (t) => t],
  ["/.well-known/security.txt", ".well-known/security.txt", (t) => t],
  // <lastmod> mang mốc thời gian lúc build, đổi mỗi lần chạy. Phần còn lại -
  // danh sách URL - mới là thứ cần canh.
  ["/sitemap.xml", "sitemap.xml", (t) => t.replace(/<lastmod>[^<]*<\/lastmod>/g, "")],
];

/**
 * Sai lệch đã biết, đã ghi trong docs/BAO-MAT.md mục 9, chỉ cảnh báo.
 *
 * Cloudflare chèn script JavaScript Detections vào mọi trang HTML kể cả khi Bot
 * Fight Mode đã tắt. Script này mang ray ID riêng cho từng request nên không thể
 * băm trước, và nó vi phạm CSP của chính site. Đây là lỗi phía Cloudflare, đã
 * quyết định chấp nhận chứ không nới CSP để chiều nó.
 */
const BIET_TRUOC = [
  {
    dau: "__CF$cv$params",
    ten: "Cloudflare chèn script JavaScript Detections",
    ghi: "Lỗi phía Cloudflare, đã chấp nhận. Xem docs/BAO-MAT.md mục 9.",
  },
];

/**
 * Tải một đường dẫn nhiều lần, trả về danh sách nội dung nhận được.
 *
 * Mỗi lượt gắn tham số ngẫu nhiên để không trúng cache biên: ta cần kiểm tra
 * lớp biến đổi nội dung của Cloudflare, chứ không phải kiểm tra cache.
 */
async function laySoMau(duongDan, soMau = SO_MAU) {
  const mau = [];
  for (let i = 0; i < soMau; i += 1) {
    const url = `${GOC}${duongDan}?kiem-tra=${Date.now()}-${i}`;
    try {
      const ph = await fetch(url, { headers: { "cache-control": "no-cache" } });
      mau.push({ ok: ph.ok, ma: ph.status, than: await ph.text(), dau: ph.headers });
    } catch (loi) {
      mau.push({ ok: false, ma: 0, than: "", dau: new Headers(), loiMang: String(loi) });
    }
  }
  return mau;
}

const loi = [];
const canhBao = [];

for (const [duongDan, tuongUng, chuanHoa] of TEP_DOI_CHIEU) {
  const mongDoi = chuanHoa(await readFile(path.join(THU_MUC, tuongUng), "utf8"));
  const mau = await laySoMau(duongDan);

  const hong = mau.filter((m) => !m.ok);
  if (hong.length > 0) {
    loi.push(`${duongDan}: ${hong.length}/${mau.length} lượt không tải được ` +
      `(${hong[0].loiMang ?? `HTTP ${hong[0].ma}`})`);
    continue;
  }

  const lech = mau.filter((m) => chuanHoa(m.than) !== mongDoi);
  if (lech.length === 0) continue;

  // Tách "đang lan" khỏi "hỏng hẳn": nếu chỉ một phần số mẫu lệch, cấu hình vừa
  // đổi và edge chưa đồng bộ xong - vẫn là lỗi, nhưng người đọc log cần biết để
  // chờ thay vì đi sửa nhầm chỗ.
  const tinhTrang = lech.length === mau.length
    ? "toàn bộ edge"
    : `${lech.length}/${mau.length} nút edge (có thể đang lan, chạy lại sau vài phút)`;
  const m = lech[0];
  loi.push(
    `${duongDan}: nội dung phục vụ khác bản trong out/ - ${tinhTrang}\n` +
    `      out/ ${mongDoi.split("\n").length} dòng, phục vụ ${chuanHoa(m.than).split("\n").length} dòng\n` +
    `      dòng đầu khác biệt: ${(chuanHoa(m.than).split("\n").find((d, j) => d !== mongDoi.split("\n")[j]) ?? "").slice(0, 90)}`
  );
}

/*
 * Trang chủ: kiểm CSP trên chính bản HTML đang được phục vụ, KHÔNG so với out/.
 *
 * Băm sha256 trong chính sách đổi theo từng lần build, nên so với bản cục bộ
 * chỉ đo được tính không tất định của build chứ không đo được gì về Cloudflare.
 * Thay vào đó kiểm tính nhất quán nội tại: mọi script nội tuyến trên trang mà
 * trình duyệt nhận được phải nằm trong danh sách băm của chính trang đó. Cách
 * này đúng với bất kỳ bản build nào, mà vẫn bắt được đúng thứ cần bắt - ai đó ở
 * giữa chèn thêm script vào trang.
 */
const RE_META = /<meta http-equiv="Content-Security-Policy" content="([^"]*)">/;
const RE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
const mauTrang = await laySoMau("/");

for (const m of mauTrang.filter((x) => x.ok)) {
  const csp = m.than.match(RE_META)?.[1];
  if (!csp) {
    loi.push("/: trang phục vụ không có thẻ meta Content-Security-Policy");
    break;
  }
  if (/script-src[^;]*'unsafe-(inline|eval)'/.test(csp)) {
    loi.push("/: CSP trên trang phục vụ bị nới lỏng bằng 'unsafe-inline' hoặc 'unsafe-eval'");
    break;
  }

  const than = m.than.replace(RE_META, "");
  const la = [...than.matchAll(RE_SCRIPT)]
    .map((x) => x[1])
    .filter((ma) => ma.length > 0)
    // Script do Cloudflare chèn đã nêu ở BIET_TRUOC, cảnh báo riêng bên dưới.
    .filter((ma) => !BIET_TRUOC.some((b) => ma.includes(b.dau)))
    .filter((ma) => !csp.includes(
      `'sha256-${createHash("sha256").update(ma, "utf8").digest("base64")}'`));

  if (la.length > 0) {
    loi.push(`/: có ${la.length} script nội tuyến trên trang phục vụ không nằm trong ` +
      `danh sách băm - dấu hiệu bị chèn mã ở giữa\n      ${la[0].slice(0, 120)}`);
    break;
  }
}

for (const { dau, ten, ghi } of BIET_TRUOC) {
  const dinh = mauTrang.filter((m) => m.ok && m.than.includes(dau));
  if (dinh.length > 0) canhBao.push(`${ten} (${dinh.length}/${mauTrang.length} mẫu). ${ghi}`);
}

/**
 * Header CSP đặt tại Cloudflare chỉ được chứa frame-ancestors. Thêm directive
 * khác vào đó sẽ chồng lên chính sách trong thẻ meta và chặn script của site -
 * đã từng làm trắng trang một lần.
 */
const cspHeader = mauTrang.find((m) => m.ok)?.dau.get("content-security-policy");
if (cspHeader) {
  const thua = cspHeader.split(";").map((d) => d.trim()).filter(Boolean)
    .filter((d) => !d.startsWith("frame-ancestors"));
  if (thua.length > 0) {
    loi.push(`header CSP tại Cloudflare có directive ngoài frame-ancestors: ${thua.join("; ")}`);
  }
}

for (const c of canhBao) console.warn(`  CẢNH BÁO: ${c}`);

if (loi.length > 0) {
  console.error(`SẢN XUẤT: ${loi.length} sai lệch giữa ${GOC} và out/ (mỗi mục ${SO_MAU} mẫu):`);
  for (const d of loi) console.error(`  - ${d}`);
  process.exit(1);
}

console.log(`SẢN XUẤT: ${GOC} khớp đúng bản trong out/ ` +
  `(${TEP_DOI_CHIEU.length} tệp + CSP trang chủ, mỗi mục ${SO_MAU} mẫu).`);
