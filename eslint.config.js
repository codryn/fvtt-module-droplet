import eslint from "@eslint/js";
import globals from "globals";
import importPlugin from "eslint-plugin-import-x";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
      "tests/manual/**"
    ]
  },
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
      "no-console": "error"
    },
  },
  {
    files: ["src/browser/**/*.ts", "src/settings/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/dropbox/*", "../dropbox/*", "../../dropbox/*"],
              message: "UI layers must not import Dropbox transport directly."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["src/services/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        { "name": "game", "message": "Services must depend on FoundryAdapter instead of game." },
        { "name": "ui", "message": "Services must depend on FoundryAdapter instead of ui." },
        { "name": "Hooks", "message": "Services must depend on FoundryAdapter instead of Hooks." },
        { "name": "CONFIG", "message": "Services must depend on FoundryAdapter instead of CONFIG." }
      ]
    }
  },
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/auth/*",
                "@/browser/*",
                "@/cache/*",
                "@/diagnostics/*",
                "@/dropbox/*",
                "@/foundry/*",
                "@/localization/*",
                "@/services/*",
                "@/settings/*"
              ],
              message: "Domain modules may only import domain and types modules."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["src/foundry/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        { "name": "game", "message": "Only foundry adapters may reference game." },
        { "name": "ui", "message": "Only foundry adapters may reference ui." },
        { "name": "Hooks", "message": "Only foundry adapters may reference Hooks." },
        { "name": "CONFIG", "message": "Only foundry adapters may reference CONFIG." }
      ]
    }
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["src/dropbox/**/*.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        { "name": "fetch", "message": "Only src/dropbox may call fetch directly." }
      ]
    }
  },
  {
    files: ["src/diagnostics/Logger.ts"],
    rules: {
      "no-console": "off"
    }
  },
  {
    files: ["**/*.config.ts", "tests/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
);