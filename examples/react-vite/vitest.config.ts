import path from "path"
import { defineConfig } from "vitest/config"

// Tests for the registry components, run against this example's copy of them
// (kept byte-identical to registry/rud/** — see scripts/check-examples-in-sync.mjs).
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
  },
})
