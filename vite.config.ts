import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

function copyRuntimeAssets(): Plugin {
  return {
    name: "droplet-copy-runtime-assets",
    async closeBundle() {
      await mkdir("dist/templates", { recursive: true });
      await cp("src/templates", "dist/templates", { recursive: true });
    },
  };
}

export default defineConfig({
  publicDir: "static",
  plugins: [copyRuntimeAssets()],
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/module.ts"),
      formats: ["es"],
      fileName: () => "droplet.js",
    },
    rollupOptions: {
      output: { assetFileNames: "droplet[extname]" },
    },
    sourcemap: false,
  },
});