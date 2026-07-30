import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/{auth,cache,domain,services}/**/*.ts", "src/dropbox/errors.ts"],
      thresholds: { lines: 90 },
    },
  },
});