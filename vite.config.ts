import { cp } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

function copyRuntimeAssets(): Plugin {
  return {
    name: "droplet-copy-runtime-assets",
    async closeBundle() {
      try {
        await cp("src/templates", "dist/templates", { recursive: true });
      } catch (error) {
        if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
          throw error;
        }
      }
    },
  };
}

export default defineConfig({
  publicDir: "static",
  plugins: [copyRuntimeAssets()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/module.ts"),
      formats: ["es"],
      fileName: () => "module.js",
    },
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names.some((name) => name.endsWith(".css"))) {
            return "styles/droplet.css";
          }

          return "assets/[name][extname]";
        },
      },
    },
    sourcemap: false,
  },
});