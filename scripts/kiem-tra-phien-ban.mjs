#!/usr/bin/env node
/**
 * Đối chiếu `version` trong package.json với bản mới nhất trong CHANGELOG.md.
 *
 * Vì sao cần: dự án duy trì nhật ký theo Keep a Changelog, nhưng `package.json`
 * đứng yên ở 1.0.0 suốt chín bản phát hành - không bước nào phản ứng. Cùng lớp
 * lỗi với việc bảy pull request (#11-#17) quên ghi nhật ký: quy trình chỉ nằm
 * trong trí nhớ thì sớm muộn cũng trôi.
 *
 * Cách dùng:
 *     node scripts/kiem-tra-phien-ban.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GOC = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const pkg = JSON.parse(
  fs.readFileSync(path.join(GOC, "package.json"), "utf-8"),
);
const nhatKy = fs.readFileSync(path.join(GOC, "CHANGELOG.md"), "utf-8");

// Bản phát hành đầu tiên gặp được tính từ đầu file chính là bản mới nhất.
const khop = nhatKy.match(/^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})$/m);
if (!khop) {
  console.error(
    "PHIÊN BẢN: không tìm thấy mục phát hành nào trong CHANGELOG.md.\n" +
      "  Mỗi mục phải theo đúng dạng: ## [1.2.3] - 2026-08-26",
  );
  process.exit(1);
}

const [, moiNhat, ngay] = khop;
if (pkg.version !== moiNhat) {
  console.error(
    `PHIÊN BẢN: package.json ghi ${pkg.version} nhưng CHANGELOG.md mới nhất là ${moiNhat}.\n` +
      "  Mỗi lần thêm mục phát hành vào CHANGELOG.md phải nâng `version` trong\n" +
      "  package.json cho khớp. Xem CONTRIBUTING.md mục \"Nhật ký thay đổi\".",
  );
  process.exit(1);
}

console.log(`PHIÊN BẢN: package.json và CHANGELOG.md cùng ở ${moiNhat} (${ngay}).`);
