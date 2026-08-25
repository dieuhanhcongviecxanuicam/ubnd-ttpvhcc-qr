import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { boDau, taoSlug, chuanHoaCoViTri, timDoanKhop } from "../src/lib/text.ts";

describe("boDau", () => {
  it("bỏ dấu tiếng Việt và chuyển chữ thường", () => {
    assert.equal(boDau("Hộ tịch"), "ho tich");
    assert.equal(boDau("Đất đai"), "dat dai");
    assert.equal(boDau("An toàn đập, hồ chứa thuỷ điện"), "an toan dap, ho chua thuy dien");
  });

  it("xử lý chữ Đ hoa và thường", () => {
    assert.equal(boDau("Đăng ký"), "dang ky");
    assert.equal(boDau("đăng ký"), "dang ky");
  });

  it("không lỗi với giá trị rỗng", () => {
    assert.equal(boDau(""), "");
    assert.equal(boDau(null), "");
    assert.equal(boDau(undefined), "");
  });
});

describe("taoSlug", () => {
  it("tạo slug URL từ tên lĩnh vực", () => {
    assert.equal(taoSlug("Hộ tịch"), "ho-tich");
    assert.equal(taoSlug("An toàn, vệ sinh lao động"), "an-toan-ve-sinh-lao-dong");
    assert.equal(taoSlug("Giáo dục nghề nghiệp (G07-LĐ06)"), "giao-duc-nghe-nghiep-g07-ld06");
  });

  it("không để lại dấu gạch thừa ở hai đầu", () => {
    assert.equal(taoSlug("  Chưa phân loại  "), "chua-phan-loai");
    assert.equal(taoSlug("--- Thử ---"), "thu");
  });
});

describe("chuanHoaCoViTri", () => {
  it("giữ ánh xạ vị trí về đúng ký tự của chuỗi gốc", () => {
    const { chuan, viTri } = chuanHoaCoViTri("Hộ tịch");
    assert.equal(chuan, "ho tich");
    // Mỗi ký tự đã chuẩn hoá phải trỏ về đúng một ký tự trong chuỗi gốc.
    assert.equal(viTri.length, chuan.length);
    assert.equal("Hộ tịch"[viTri[0]], "H");
    assert.equal("Hộ tịch"[viTri[chuan.length - 1]], "h");
  });

  it("chỉ số không bao giờ vượt ngoài chuỗi gốc", () => {
    const goc = "Đăng ký khai sinh có yếu tố nước ngoài";
    const { chuan, viTri } = chuanHoaCoViTri(goc);
    assert.ok(viTri.every((i) => i >= 0 && i < goc.length));
    assert.equal(viTri.length, chuan.length);
  });
});

describe("timDoanKhop", () => {
  it("tìm được khi người dùng gõ không dấu", () => {
    const d = timDoanKhop("Hộ tịch", "ho tich");
    assert.equal(d.length, 1);
    assert.equal("Hộ tịch".slice(d[0].batDau, d[0].ketThuc), "Hộ tịch");
  });

  it("trả lại đúng đoạn CÓ DẤU của chuỗi gốc", () => {
    const goc = "Cấp bản sao Trích lục hộ tịch";
    const d = timDoanKhop(goc, "ho tich");
    assert.equal(goc.slice(d[0].batDau, d[0].ketThuc), "hộ tịch");
  });

  it("không phân biệt hoa thường", () => {
    const goc = "Thành lập và hoạt động của tổ hợp tác";
    const d = timDoanKhop(goc, "TO HOP");
    assert.equal(goc.slice(d[0].batDau, d[0].ketThuc), "tổ hợp");
  });

  it("tìm được nhiều đoạn khớp, không chồng lấn", () => {
    const goc = "đất đai và tài chính đất đai";
    const d = timDoanKhop(goc, "dat dai");
    assert.equal(d.length, 2);
    assert.ok(d[0].ketThuc <= d[1].batDau);
    for (const x of d) assert.equal(boDau(goc.slice(x.batDau, x.ketThuc)), "dat dai");
  });

  it("khớp được mã TTHC có dấu chấm", () => {
    const d = timDoanKhop("1.005277", "005277");
    assert.equal("1.005277".slice(d[0].batDau, d[0].ketThuc), "005277");
  });

  it("trả mảng rỗng khi từ khoá rỗng hoặc không khớp", () => {
    assert.deepEqual(timDoanKhop("Hộ tịch", ""), []);
    assert.deepEqual(timDoanKhop("Hộ tịch", "   "), []);
    assert.deepEqual(timDoanKhop("Hộ tịch", "xyz"), []);
  });
});
