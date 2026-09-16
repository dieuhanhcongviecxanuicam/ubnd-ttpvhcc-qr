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
 * LẤY NHIỀU MẪU, KHÔNG LẤY MỘT. Cũng hôm đó, sau khi tắt công tắc, các lượt gọi
 * liên tiếp trả về lẫn lộn bản mới và bản cũ, tỉ lệ sạch đứng yên quanh 20%
 * suốt mười phút. Đã thử quy cho việc cấu hình lan dần giữa các trung tâm dữ
 * liệu, nhưng 24 lượt đo kèm mã cf-ray cho thấy CẢ HAI kết quả cùng đến từ một
 * trung tâm (SIN) - nên không phải chuyện lan theo vị trí địa lý. Nguyên nhân
 * thật vẫn chưa biết; điều đo được là Cloudflare áp cấu hình không nhất quán
 * giữa các request giống hệt nhau.
 *
 * Hệ quả cho script: một mẫu đơn lẻ vừa báo động giả được vừa bỏ lọt được, bất
 * kể nguyên nhân là gì. Lấy SO_MAU mẫu mỗi tệp và báo tỉ lệ, để người đọc log
 * phân biệt "lệch hoàn toàn" với "lệch một phần".
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

/*
 * Tên miền viết thẳng, KHÔNG đọc từ public/CNAME rồi ghép vào URL.
 *
 * Bản đầu đọc CNAME cho khỏi lặp, và CodeQL báo js/file-access-to-http: nội dung
 * một tệp chảy thẳng vào request mạng. Cảnh báo đúng về nguyên tắc - ai sửa
 * được tệp đó thì lái được mọi request của script đi nơi khác.
 *
 * Cách xử lý theo đúng tiền lệ trong scripts/kiem-tra-tro-nang.mjs: bỏ hẳn
 * đường dẫn dữ liệu thay vì dựng chốt canh, vì chốt canh dễ hỏng khi người sau
 * sửa, còn thứ không tồn tại thì không hỏng được.
 *
 * Viết thẳng ở đây không làm mất nguồn sự thật duy nhất - CNAME vẫn là nguồn,
 * và phép đối chiếu ngay bên dưới bắt lỗi ngay nếu hai bên lệch nhau.
 */
const MIEN = "ttpvhcc.xanuicam.vn";

const theoCname = (await readFile(
  path.join(process.cwd(), "public", "CNAME"), "utf8")).trim();
if (theoCname !== MIEN) {
  console.error(
    `SẢN XUẤT: public/CNAME ghi "${theoCname}" nhưng script canh "${MIEN}".\n` +
    "  Tên miền đã đổi thì sửa hằng số MIEN trong scripts/kiem-tra-san-xuat.mjs " +
    "cho khớp,\n  nếu không script sẽ canh nhầm site."
  );
  process.exit(1);
}

const doiSo = process.argv.indexOf("--goc");
const GOC = doiSo !== -1 ? process.argv[doiSo + 1] : `https://${MIEN}`;

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
 * Cloudflare chèn script JavaScript Detections vào trang HTML. Script mang ray
 * ID riêng cho từng request nên không băm trước được, và vi phạm CSP của site.
 * Từ 16/09/2026 luật `no-transform` (scripts/bao-ve-cloudflare.py) đã chặn được
 * việc chèn: đo 0/30 trang. Vẫn giữ mục này để cảnh báo nếu script quay lại -
 * khi đó luật biến đổi header đã bị gỡ hoặc hết tác dụng.
 */
const BIET_TRUOC = [
  {
    dau: "__CF$cv$params",
    ten: "Cloudflare chèn script JavaScript Detections",
    ghi: "Luật no-transform có thể đã mất tác dụng - chạy scripts/bao-ve-cloudflare.py --kiem-tra. Xem docs/BAO-MAT.md mục 9.",
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
      mau.push({
        ok: ph.ok,
        ma: ph.status,
        than: await ph.text(),
        dau: ph.headers,
        // Cloudflare gắn header này khi trả trang thách thức thay cho nội dung
        // thật - phân biệt được "bị chặn vì trông giống bot" với lỗi máy chủ.
        thachThuc: ph.headers.get("cf-mitigated") === "challenge",
        ray: ph.headers.get("cf-ray") ?? "",
      });
    } catch (loi) {
      mau.push({ ok: false, ma: 0, than: "", dau: new Headers(), loiMang: String(loi) });
    }
  }
  return mau;
}

const loi = [];
const canhBao = [];
/*
 * Mục không kiểm được vì Cloudflare thách thức chính script này.
 *
 * Đã xảy ra thật, 16/09/2026: sau khi Bot Fight Mode bật lại (hệ thống khác trên
 * zone cần nó), máy chạy GitHub Actions - IP trung tâm dữ liệu, User-Agent của
 * Node - nhận 403 kèm `cf-mitigated: challenge` ở sitemap.xml và trang chủ.
 * robots.txt và /.well-known/ vẫn qua vì Cloudflare miễn hai đường dẫn đó khỏi
 * Bot Fight Mode. Từ máy người dùng thật mọi thứ trả 200.
 *
 * Tách riêng khỏi `loi` vì đây không phải sai lệch nội dung: người dân vẫn nhận
 * đúng trang, chỉ có máy canh bị chặn. Báo đỏ mỗi ngày cho chuyện đó thì chẳng
 * bao lâu không ai đọc log nữa. Nhưng cũng KHÔNG được im lặng - bản trước bỏ
 * qua mẫu hỏng của trang chủ bằng filter(ok), nên khi cả 5 mẫu bị chặn, phần
 * kiểm CSP không chạy mà script vẫn in "khớp đúng".
 */
const khongKiemDuoc = [];
const chiThachThuc = (mau) => mau.every((m) => !m.ok && m.thachThuc);

for (const [duongDan, tuongUng, chuanHoa] of TEP_DOI_CHIEU) {
  const mongDoi = chuanHoa(await readFile(path.join(THU_MUC, tuongUng), "utf8"));
  const mau = await laySoMau(duongDan);

  const hong = mau.filter((m) => !m.ok);
  if (hong.length > 0 && chiThachThuc(hong) && hong.length === mau.length) {
    khongKiemDuoc.push(`${duongDan}: Cloudflare thách thức ${hong.length}/${mau.length} lượt ` +
      `(HTTP ${hong[0].ma}, cf-ray ${hong[0].ray})`);
    continue;
  }
  if (hong.length > 0) {
    loi.push(`${duongDan}: ${hong.length}/${mau.length} lượt không tải được ` +
      `(${hong[0].loiMang ?? `HTTP ${hong[0].ma}`})`);
    continue;
  }

  const lech = mau.filter((m) => chuanHoa(m.than) !== mongDoi);
  if (lech.length === 0) continue;

  // Tách "lệch hoàn toàn" khỏi "lệch một phần". Lệch một phần nghĩa là Cloudflare
  // đang áp cấu hình không nhất quán giữa các request giống hệt nhau - đã đo
  // được trạng thái này và nó đứng yên hàng chục phút, nên đừng mặc định cứ chờ
  // là hết.
  const tinhTrang = lech.length === mau.length
    ? "mọi mẫu đều lệch"
    : `${lech.length}/${mau.length} mẫu lệch - Cloudflare áp cấu hình không nhất quán`;
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

if (!mauTrang.some((m) => m.ok)) {
  if (chiThachThuc(mauTrang)) {
    khongKiemDuoc.push(`/ (CSP trang chủ): Cloudflare thách thức ${mauTrang.length}/${mauTrang.length} ` +
      `lượt (HTTP ${mauTrang[0].ma}, cf-ray ${mauTrang[0].ray})`);
  } else {
    const m = mauTrang[0];
    loi.push(`/: ${mauTrang.length}/${mauTrang.length} lượt không tải được ` +
      `(${m.loiMang ?? `HTTP ${m.ma}`})`);
  }
}

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

if (khongKiemDuoc.length > 0) {
  console.warn(`  KHÔNG KIỂM ĐƯỢC ${khongKiemDuoc.length} mục - Cloudflare thách thức máy chạy ` +
    "script (Bot Fight Mode chặn IP trung tâm dữ liệu).\n" +
    "  Người dân không bị ảnh hưởng. Muốn kiểm đủ, chạy `npm run build && npm run " +
    "kiem-tra-san-xuat` từ một máy trong mạng thường.");
  for (const d of khongKiemDuoc) console.warn(`    - ${d}`);
  if (process.env.GITHUB_ACTIONS) {
    console.log(`::warning::Không kiểm được ${khongKiemDuoc.length} mục vì Cloudflare thách thức ` +
      "máy chạy GitHub Actions. Xem log để biết chi tiết.");
  }
}

if (loi.length > 0) {
  console.error(`SẢN XUẤT: ${loi.length} sai lệch giữa ${GOC} và out/ (mỗi mục ${SO_MAU} mẫu):`);
  for (const d of loi) console.error(`  - ${d}`);
  process.exit(1);
}

const daKiem = TEP_DOI_CHIEU.length + 1 - khongKiemDuoc.length;
console.log(`SẢN XUẤT: ${daKiem}/${TEP_DOI_CHIEU.length + 1} mục kiểm được đều khớp giữa ${GOC} ` +
  `và out/ (${TEP_DOI_CHIEU.length} tệp + CSP trang chủ, mỗi mục ${SO_MAU} mẫu).`);
