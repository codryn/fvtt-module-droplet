import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup/foundry.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/{auth,cache,diagnostics,domain,dropbox,foundry,localization,services,settings,types}/**/*.ts",
        "src/constants.ts",
        "src/module.ts"
      ],
      thresholds: { lines: 90 },
    },
  },
});