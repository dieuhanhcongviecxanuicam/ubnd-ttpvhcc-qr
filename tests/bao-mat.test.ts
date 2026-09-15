import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

/**
 * Canh tệp security.txt (RFC 9116) - kênh báo lỗ hổng công khai của hệ thống.
 *
 * Vì sao cần test: trường `Expires` là thứ duy nhất trong kho mã tự hỏng theo
 * thời gian. Quá hạn thì theo RFC, công cụ quét và người báo cáo phải coi tệp là
 * không còn hiệu lực - kênh báo lỗ hổng lặng lẽ biến mất mà không ai nhận ra,
 * vì trang vẫn chạy và CI vẫn xanh. Test này bắt đầu kêu trước 60 ngày, đủ sớm
 * để gia hạn trong một lần bảo trì bình thường.
 */
const TEP = path.join(process.cwd(), "public", ".well-known", "security.txt");
const NGUONG_CANH_BAO_NGAY = 60;

describe("security.txt (RFC 9116)", () => {
  const noi_dung = fs.readFileSync(TEP, "utf-8");
  const truong = (ten: string) =>
    noi_dung
      .split("\n")
      .filter((d) => !d.trimStart().startsWith("#"))
      .find((d) => d.toLowerCase().startsWith(`${ten.toLowerCase()}:`))
      ?.slice(ten.length + 1)
      .trim();

  it("có đủ các trường bắt buộc và nên có", () => {
    for (const ten of ["Contact", "Expires", "Canonical", "Policy", "Preferred-Languages"]) {
      assert.ok(truong(ten), `thiếu trường ${ten}`);
    }
  });

  it("Contact và Canonical là URL https", () => {
    for (const ten of ["Contact", "Canonical", "Policy"]) {
      assert.match(truong(ten)!, /^https:\/\//, `${ten} phải là URL https`);
    }
  });

  it("Canonical trỏ đúng vị trí tệp trên site thật", () => {
    assert.equal(
      truong("Canonical"),
      "https://ttpvhcc.xanuicam.vn/.well-known/security.txt",
    );
  });

  it(`Expires còn hạn và còn hơn ${NGUONG_CANH_BAO_NGAY} ngày`, () => {
    const het_han = new Date(truong("Expires")!);
    assert.ok(!Number.isNaN(het_han.getTime()), "Expires không phải mốc thời gian hợp lệ");

    const con_lai = Math.floor((het_han.getTime() - Date.now()) / 86_400_000);
    assert.ok(
      con_lai > NGUONG_CANH_BAO_NGAY,
      `security.txt còn ${con_lai} ngày là hết hạn (${het_han.toISOString()}).\n` +
        "  Gia hạn trường Expires trong public/.well-known/security.txt, " +
        "đồng thời rà lại kênh tiếp nhận ở Contact còn đúng người không.",
    );
  });

  /** RFC 9116 yêu cầu đúng MỘT trường Expires - nhiều hơn là tệp không hợp lệ. */
  it("chỉ có một trường Expires", () => {
    const so_dong = noi_dung
      .split("\n")
      .filter((d) => /^expires:/i.test(d.trim())).length;
    assert.equal(so_dong, 1);
  });
});
