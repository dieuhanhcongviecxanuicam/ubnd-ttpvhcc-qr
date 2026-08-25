import next from "eslint-config-next";

/**
 * ESLint flat config. Từ Next 16, `next lint` đã bị gỡ bỏ nên dự án gọi thẳng
 * eslint (xem script "lint" trong package.json).
 */
const config = [
  { ignores: [".next/**", "out/**", "node_modules/**", ".venv/**", "next-env.d.ts"] },
  ...next,
];

export default config;
