import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@customer-portal-pro/config-schema": path.resolve(__dirname, "./packages/config-schema/src/index.ts"),
      "@customer-portal-pro/component-registry": path.resolve(__dirname, "./packages/component-registry/src/index.ts"),
    },
  },
});
