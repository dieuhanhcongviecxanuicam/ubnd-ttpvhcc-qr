import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
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

  it("có mã QR tổng", () => {
    for (const duoi of ["png", "svg"]) {
      assert.ok(fs.existsSync(path.join(THU_MUC_QR, `master.${duoi}`)), `thiếu master.${duoi}`);
    }
  });

  it("không còn mã QR mồ côi của lĩnh vực đã bị gỡ", () => {
    const hop_le = new Set(linhVuc.flatMap((lv) => [`lv-${lv.slug}.png`, `lv-${lv.slug}.svg`]));
    hop_le.add("master.png");
    hop_le.add("master.svg");
    const thua = fs.readdirSync(THU_MUC_QR).filter((f) => !hop_le.has(f));
    assert.deepEqual(thua, []);
  });
});
