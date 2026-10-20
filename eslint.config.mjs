// Agoraya — ESLint flat config (ESLint 9)
//
// Layers:
//   1. eslint:recommended (base JS rules)
//   2. eslint-config-next (core-web-vitals + typescript) bridged via FlatCompat
//      because eslint-config-next@15 ships legacy configs only
//   3. eslint-plugin-security recommended (security rules required by the issue)
//   4. project-specific overrides

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

export default tseslint.config(
  {
    name: "agoraya/ignores",
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      ".turbo/**",
      "next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  security.configs.recommended,
  {
    name: "agoraya/rules",
    rules: {
      // TypeScript strictness — keep type-only imports explicit
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      // Never silence type errors
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
  {
    name: "agoraya/tests",
    files: ["tests/**/*.{ts,tsx}"],
    rules: {
      // Tests may use `any` when asserting boundary behavior
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
