import path from "path"
import tailwindcss from "@tailwindcss/vite"
import preact from "@preact/preset-vite"
import { defineConfig } from "vite"

/**
 * Preact setup. `@preact/preset-vite` aliases react and react-dom to
 * `preact/compat`, which is the entire story — the same component sources the
 * React example uses are copied here byte-for-byte.
 */
export default defineConfig({
  plugins: [preact(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
