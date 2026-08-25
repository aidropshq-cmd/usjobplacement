import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The Django backend is not a JS project. Without this, ESLint walks
    // backend/.venv and reports 159 errors inside vendored jQuery and DRF
    // bundles, which buries anything real in our own source.
    "backend/**",
    "**/.venv/**",
  ]),
]);

export default eslintConfig;
