import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  // Avoid loading Tailwind PostCSS during pure lib unit tests
  css: {
    postcss: { plugins: [] },
  },
});
