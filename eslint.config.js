import eslint from "@eslint/js";
import globals from "globals";
import importPlugin from "eslint-plugin-import-x";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", "playwright-report/**", "test-results/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
      globals: { ...globals.browser },
    },
    plugins: { import: importPlugin },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "import/no-cycle": "error",
      "no-console": ["error", { "allow": ["warn", "error"] }]
    },
  },
  {
    files: ["**/*.config.ts", "tests/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
);