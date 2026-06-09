import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended
});

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "-d/**",
      ".codex-tools/**",
      "final_paragraphs*.txt",
      "final_body_esc.txt",
      "angle_paras*.txt",
      "thesis_deep.txt",
      "*.tsbuildinfo",
      "*.log",
      "*.pid"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript")
];

export default config;
