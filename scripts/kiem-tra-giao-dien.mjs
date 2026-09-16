#!/usr/bin/env node
/**
 * Khẳng định các chi tiết giao diện đã từng hỏng mà không bước CI nào bắt được.
 *
 * Vì sao cần: ngày 16/09/2026 bản 1.20.0 đổi biểu tượng "Hỗ trợ, hướng dẫn" trên
 * bảng niêm yết sang trắng, nhưng luật `.chanKhoi span` cụ thể hơn đè mất màu.
 * Typecheck, lint, test, CSP, trợ năng đều xanh - biểu tượng vẫn đen, và người
 * dùng phải chụp màn hình báo lại. Tệ hơn, lượt kiểm tay trên site thật hôm đó
 * đã IN RA màu đen mà không ai đối chiếu với yêu cầu.
 *
 * Mỗi mục dưới đây là một phép so bằng (giá trị đo === giá trị mong đợi), không
 * phải một dòng log. Chỉ canh những thứ đã hỏng thật hoặc dễ hỏng âm thầm vì
 * CSS thừa kế - không chụp ảnh so từng điểm ảnh, vì build không tất định và bộ
 * chữ khử răng cưa khác nhau giữa các máy sẽ báo động giả liên tục.
 *
 * Cách dùng:
 *     npm run build && npm run kiem-tra-giao-dien
 */
import path from "node:path";
import { chromium } from "playwright";
import { moMayChuOut } from "./may-chu-out.mjs";

const { may, goc } = await moMayChuOut(path.resolve(process.cwd(), "out"));
const trinhDuyet = await chromium.launch();

const truot = [];
let soMuc = 0;
const loiConsole = [];

function bang(ten, thuc, mong) {
  soMuc += 1;
  if (thuc !== mong) truot.push(`${ten}: đo được ${JSON.stringify(thuc)}, mong đợi ${JSON.stringify(mong)}`);
}

async function moTrang(duongDan, rong, cao = 900) {
  const trang = await trinhDuyet.newPage({ viewport: { width: rong, height: cao } });
  trang.on("console", (m) => {
    if (m.type() === "error") loiConsole.push(`${duongDan} @${rong}px: ${m.text().slice(0, 160)}`);
  });
  const ph = await trang.goto(`${goc}${duongDan}`, { waitUntil: "networkidle" });
  bang(`${duongDan} @${rong}px tải được`, ph?.status(), 200);
  return trang;
}

const TRANG = "rgb(255, 255, 255)";
const DO_SON = "rgb(155, 34, 38)";

// ---------- Trang chủ, máy tính và điện thoại ----------
for (const rong of [1440, 390]) {
  const trang = await moTrang("/", rong);
  const d = await trang.evaluate(() => {
    const tam = (e) => { const r = e.getBoundingClientRect(); return Math.round((r.left + r.right) / 2); };
    const the = document.querySelector(".qr-tong-the");
    const q = (s) => the.querySelector(s);
    const kieu = (s) => { const c = getComputedStyle(q(s)); return `${c.fontFamily} ${c.fontSize} ${c.color}`; };
    const logo = document.querySelector(".logo-dau");
    return {
      tenDonVi: document.querySelector(".brand-ten")?.textContent,
      dongPhu: document.querySelector(".brand-phu")?.textContent,
      logoRong: logo.naturalWidth,
      tamThe: tam(the),
      tamAnh: tam(q("img")),
      tamMoTa: tam(q(".qr-mo-ta")),
      tamUrl: tam(q(".qr-lienket")),
      kieuMoTa: kieu(".qr-mo-ta"),
      kieuUrl: kieu(".qr-lienket"),
      canhSo: [...document.querySelectorAll(".thong-ke > div")].map((e) => getComputedStyle(e).textAlign),
      // Tràn ngang là lỗi hay gặp nhất khi đổi chữ ở header thành chuỗi dài.
      tranNgang: document.documentElement.scrollWidth > window.innerWidth,
    };
  });
  const o = `/ @${rong}px`;
  bang(`${o} header - tên đơn vị`, d.tenDonVi, "Trung tâm Phục vụ Hành chính công");
  bang(`${o} header - dòng phụ`, d.dongPhu, "Xã Núi Cấm");
  // 256px để còn nét khi người dùng phóng to trình duyệt; bản 128px bị xén mép.
  bang(`${o} logo header đủ độ phân giải`, d.logoRong >= 256, true);
  bang(`${o} thẻ QR tổng - mã QR canh giữa`, d.tamAnh, d.tamThe);
  bang(`${o} thẻ QR tổng - dòng mô tả canh giữa`, d.tamMoTa, d.tamThe);
  bang(`${o} thẻ QR tổng - địa chỉ canh giữa`, d.tamUrl, d.tamThe);
  bang(`${o} thẻ QR tổng - địa chỉ cùng kiểu chữ với mô tả`, d.kieuUrl, d.kieuMoTa);
  bang(`${o} số liệu thống kê canh giữa`, d.canhSo.join(","), "center,center,center");
  bang(`${o} không tràn ngang`, d.tranNgang, false);
  await trang.close();
}

// ---------- Bảng niêm yết A1 ----------
{
  const trang = await moTrang("/in-ma-qr/bang-niem-yet", 1600, 1200);
  const d = await trang.evaluate(() => {
    const bang = document.querySelector("article");
    const icon = bang.querySelector("[class*='chanIcon']");
    const net = icon?.querySelector("svg path");
    const chuLogo = bang.querySelector("header p");
    return {
      nenIcon: icon && getComputedStyle(icon).backgroundColor,
      mauIcon: icon && getComputedStyle(icon).color,
      netIcon: net && getComputedStyle(net).stroke,
      conKhauHieuPhai: bang.textContent.includes("Hành chính phục vụ"),
      fontCanhLogo: getComputedStyle(chuLogo).fontFamily.split(",")[0].trim().toLowerCase(),
      tranNgang: [...bang.querySelectorAll("header > *")].some((e) => e.scrollWidth > e.clientWidth + 1),
    };
  });
  const o = "/in-ma-qr/bang-niem-yet";
  bang(`${o} biểu tượng hỗ trợ - nền đỏ`, d.nenIcon, DO_SON);
  bang(`${o} biểu tượng hỗ trợ - màu trắng`, d.mauIcon, TRANG);
  bang(`${o} biểu tượng hỗ trợ - nét SVG trắng`, d.netIcon, TRANG);
  bang(`${o} không còn khẩu hiệu "Hành chính phục vụ"`, d.conKhauHieuPhai, false);
  bang(`${o} chữ cạnh logo dùng Lora`, d.fontCanhLogo, "lora");
  bang(`${o} đầu bảng không tràn chữ`, d.tranNgang, false);
  await trang.close();
}

// ---------- Trang /in-ma-qr và ba trang bản in ----------
{
  const trang = await moTrang("/in-ma-qr", 1440);
  const soMoTa = await trang.evaluate(() =>
    document.querySelectorAll("[class*='hubDau'] > div > p").length);
  bang("/in-ma-qr không còn đoạn mô tả dưới tên bản in", soMoTa, 0);
  await trang.close();
}

for (const duongDan of ["/in-ma-qr/bang-niem-yet", "/in-ma-qr/to-nhom", "/in-ma-qr/tem-ma-qr"]) {
  const trang = await moTrang(duongDan, 1440, 400);
  const lk = await trang.evaluate(() => {
    const a = document.querySelector("a[class*='trangInLienKet']");
    return a && { href: a.getAttribute("href"), chu: a.textContent, vien: getComputedStyle(a).borderTopWidth };
  });
  bang(`${duongDan} có nút "In bộ mã QR"`, lk?.chu, "In bộ mã QR");
  bang(`${duongDan} nút dẫn về /in-ma-qr`, lk?.href, "/in-ma-qr");
  bang(`${duongDan} nút có viền`, lk?.vien !== "0px", true);
  await trang.close();
}

await trinhDuyet.close();
may.close();

bang("không có lỗi console", loiConsole.length, 0);

if (truot.length > 0) {
  console.error(`GIAO DIỆN: ${truot.length}/${soMuc} mục trượt:`);
  for (const t of truot) console.error(`  - ${t}`);
  for (const l of loiConsole) console.error(`      console: ${l}`);
  process.exit(1);
}

console.log(`GIAO DIỆN: ${soMuc}/${soMuc} mục đạt.`);
