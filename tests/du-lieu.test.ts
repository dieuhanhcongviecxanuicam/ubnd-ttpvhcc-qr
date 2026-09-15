import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import {
  hinhCuaLinhVuc,
  NHOM_CUA_LINH_VUC,
  NHOM_LINH_VUC,
} from "../src/lib/nhom-linh-vuc.ts";
import { BAN_IN } from "../src/lib/ban-in.ts";
import { LIEN_HE } from "../src/lib/site-config.ts";
import { taoSlug } from "../src/lib/text.ts";
import type { LinhVuc, Meta, Tthc } from "../src/lib/types.ts";

const GOC = path.join(process.cwd(), "data");
const doc = <T>(t: string): T => JSON.parse(fs.readFileSync(path.join(GOC, t), "utf-8"));

const tthc = doc<Tthc[]>("tthc.json");
const linhVuc = doc<LinhVuc[]>("linh-vuc.json");
const meta = doc<Meta>("meta.json");
const theoMa = new Map(tthc.map((t) => [t.ma_tthc, t]));

describe("Toàn vẹn danh mục TTHC", () => {
  it("mọi mã TTHC là duy nhất", () => {
    assert.equal(theoMa.size, tthc.length, "có mã TTHC bị trùng");
  });

  it("mọi TTHC đều có mã và tên", () => {
    const thieu = tthc.filter((t) => !t.ma_tthc?.trim() || !t.ten_tthc?.trim());
    assert.deepEqual(thieu.map((t) => t.ma_tthc), []);
  });

  it("số liệu trong meta.json khớp dữ liệu thật", () => {
    assert.equal(meta.tong_so_tthc, tthc.length);
    assert.equal(meta.tong_so_linh_vuc, linhVuc.length);
  });
});

describe("Toàn vẹn danh mục lĩnh vực", () => {
  /**
   * Đây là bất biến quan trọng nhất. Lỗi từng lọt ra production: lĩnh vực
   * "Chưa phân loại" hiển thị "7 thủ tục hành chính" nhưng danh sách trống, vì
   * số đếm lấy từ linh-vuc.json còn danh sách lại lọc bản ghi theo tên lĩnh vực.
   */
  it("so_luong_tthc khớp số mã giải được trong danh_sach_ma_tthc", () => {
    const lech = linhVuc
      .map((lv) => ({
        slug: lv.slug,
        dem: lv.so_luong_tthc,
        thuc_te: lv.danh_sach_ma_tthc.filter((ma) => theoMa.has(ma)).length,
      }))
      .filter((x) => x.dem !== x.thuc_te);
    assert.deepEqual(lech, [], "số đếm và danh sách lệch nhau");
  });

  it("mọi mã trong danh_sach_ma_tthc đều tồn tại trong tthc.json", () => {
    const mo_coi = linhVuc.flatMap((lv) =>
      lv.danh_sach_ma_tthc.filter((ma) => !theoMa.has(ma)).map((ma) => `${lv.slug}:${ma}`),
    );
    assert.deepEqual(mo_coi, []);
  });

  it("mọi TTHC thuộc đúng một lĩnh vực, không sót không trùng", () => {
    const dem = new Map<string, number>();
    for (const lv of linhVuc) {
      for (const ma of lv.danh_sach_ma_tthc) dem.set(ma, (dem.get(ma) ?? 0) + 1);
    }
    assert.deepEqual([...theoMa.keys()].filter((ma) => !dem.has(ma)), [], "có TTHC không thuộc lĩnh vực nào");
    assert.deepEqual([...dem].filter(([, n]) => n > 1).map(([ma]) => ma), [], "có TTHC thuộc nhiều lĩnh vực");
  });

  it("slug là duy nhất - hai lĩnh vực trùng slug sẽ dùng chung URL và mã QR", () => {
    const slugs = linhVuc.map((lv) => lv.slug);
    assert.equal(new Set(slugs).size, slugs.length);
  });

  it("slug do TypeScript sinh khớp slug do pipeline Python ghi", () => {
    const lech = linhVuc
      .filter((lv) => taoSlug(lv.ten_linh_vuc) !== lv.slug)
      .map((lv) => `${lv.ten_linh_vuc} -> ${taoSlug(lv.ten_linh_vuc)} ≠ ${lv.slug}`);
    assert.deepEqual(lech, []);
  });

  it("slug chỉ gồm chữ thường, số và dấu gạch ngang", () => {
    const xau = linhVuc.filter((lv) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(lv.slug));
    assert.deepEqual(xau.map((lv) => lv.slug), []);
  });
});

describe("Mã QR", () => {
  const THU_MUC_QR = path.join(process.cwd(), "public", "qr");

  it("mỗi lĩnh vực có đủ mã QR bản PNG và SVG", () => {
    const thieu: string[] = [];
    for (const lv of linhVuc) {
      for (const duoi of ["png", "svg"]) {
        const f = path.join(THU_MUC_QR, `lv-${lv.slug}.${duoi}`);
        if (!fs.existsSync(f)) thieu.push(path.basename(f));
      }
    }
    assert.deepEqual(thieu, []);
  });

  it("mỗi nhóm có đủ mã QR bản PNG và SVG", () => {
    const thieu: string[] = [];
    for (const n of NHOM_LINH_VUC) {
      for (const duoi of ["png", "svg"]) {
        const f = path.join(THU_MUC_QR, `nhom-${n.id}.${duoi}`);
        if (!fs.existsSync(f)) thieu.push(path.basename(f));
      }
    }
    assert.deepEqual(thieu, []);
  });

  /**
   * URL cổng dịch vụ công khai báo ở hai nơi không chung ngôn ngữ: Python sinh mã
   * QR, TypeScript in chữ cạnh mã. Lệch nhau là bảng niêm yết in một địa chỉ mà
   * mã QR bên cạnh lại mở địa chỉ khác.
   */
  it("URL dịch vụ công khớp giữa pipeline Python và site-config", () => {
    for (const tep of ["tao-ma-qr.py", "kiem-tra-ma-qr.py"]) {
      const noi_dung = fs.readFileSync(path.join(process.cwd(), "scripts", tep), "utf-8");
      const khop = noi_dung.match(/^URL_DICH_VU_CONG = "([^"]+)"$/m);
      assert.ok(khop, `${tep} không khai báo URL_DICH_VU_CONG`);
      assert.equal(khop[1], LIEN_HE.dichVuCongUrl, `${tep} lệch với site-config`);
    }
  });

  it("có mã QR tổng", () => {
    for (const duoi of ["png", "svg"]) {
      assert.ok(fs.existsSync(path.join(THU_MUC_QR, `master.${duoi}`)), `thiếu master.${duoi}`);
    }
  });

  it("không còn mã QR mồ côi của lĩnh vực đã bị gỡ", () => {
    const hop_le = new Set(linhVuc.flatMap((lv) => [`lv-${lv.slug}.png`, `lv-${lv.slug}.svg`]));
    hop_le.add("master.png");
    hop_le.add("master.svg");
    for (const n of NHOM_LINH_VUC) {
      hop_le.add(`nhom-${n.id}.png`);
      hop_le.add(`nhom-${n.id}.svg`);
    }
    hop_le.add("dich-vu-cong.png");
    hop_le.add("dich-vu-cong.svg");
    const thua = fs.readdirSync(THU_MUC_QR).filter((f) => !hop_le.has(f));
    assert.deepEqual(thua, []);
  });
});

describe("Nhóm ngành và hình minh hoạ", () => {
  const THU_MUC_HINH = path.join(process.cwd(), "public", "minh-hoa");

  it("mọi lĩnh vực đều được xếp vào một nhóm đã khai báo", () => {
    const hop_le = new Set(NHOM_LINH_VUC.map((n) => n.id));
    const sai = linhVuc
      .filter((lv) => !hop_le.has(NHOM_CUA_LINH_VUC[lv.slug]))
      .map((lv) => lv.slug);
    assert.deepEqual(sai, [], "lĩnh vực chưa xếp nhóm sẽ rơi hết vào nhóm 'Khác'");
  });

  it("bảng xếp nhóm không còn slug của lĩnh vực đã bị gỡ", () => {
    const co_that = new Set(linhVuc.map((lv) => lv.slug));
    const mo_coi = Object.keys(NHOM_CUA_LINH_VUC).filter((s) => !co_that.has(s));
    assert.deepEqual(mo_coi, []);
  });

  it("mọi hình minh hoạ được tham chiếu đều tồn tại", () => {
    const thieu = linhVuc
      .map((lv) => hinhCuaLinhVuc(lv.slug))
      .filter((h) => !fs.existsSync(path.join(THU_MUC_HINH, h)));
    assert.deepEqual([...new Set(thieu)], []);
  });

  /** Hình không ai dùng vẫn bị tải về theo bản build - phát hiện sớm còn hơn để rác. */
  it("không có tệp hình minh hoạ mồ côi", () => {
    const dang_dung = new Set([
      ...NHOM_LINH_VUC.map((n) => n.hinh),
      ...linhVuc.map((lv) => hinhCuaLinhVuc(lv.slug)),
    ]);
    const thua = fs.readdirSync(THU_MUC_HINH).filter((f) => !dang_dung.has(f));
    assert.deepEqual(thua, []);
  });
});

describe("Bản in PDF", () => {
  /**
   * Route khai trong BAN_IN phải có trang thật. Sai ở đây thì trang /in-ma-qr
   * vẫn hiện nút tải, còn scripts/dung-ban-in.ts dựng ra một tệp PDF của trang
   * 404 - không ai phát hiện cho tới lúc mang ra tiệm in.
   */
  it("mỗi bản in có trang nguồn tương ứng", () => {
    const thieu = BAN_IN.filter(
      (b) => !fs.existsSync(path.join(process.cwd(), "src", "app", b.route, "page.tsx")),
    ).map((b) => b.route);
    assert.deepEqual(thieu, []);
  });

  it("tên tệp và id bản in là duy nhất", () => {
    assert.equal(new Set(BAN_IN.map((b) => b.id)).size, BAN_IN.length);
    assert.equal(new Set(BAN_IN.map((b) => b.tep)).size, BAN_IN.length);
  });

  /** Khổ giấy phải theo tỉ lệ khổ A (1:√2) thì in A4, A3, A1, A0 mới không lệch lề. */
  it("mọi khổ giấy giữ đúng tỉ lệ khổ A", () => {
    for (const b of BAN_IN) {
      const tiLe = Math.max(b.rongMm, b.caoMm) / Math.min(b.rongMm, b.caoMm);
      assert.ok(
        Math.abs(tiLe - Math.SQRT2) < 0.01,
        `${b.id}: ${b.rongMm}×${b.caoMm} mm có tỉ lệ ${tiLe.toFixed(3)}, khổ A phải là ${Math.SQRT2.toFixed(3)}`,
      );
    }
  });
});
