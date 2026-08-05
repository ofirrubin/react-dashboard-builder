import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // Declarations come from `tsc -p tsconfig.build.json` instead. tsup's dts
  // build injects its own compiler options (notably `baseUrl`) and broke
  // outright on TypeScript 6; `tsc` is the right tool for a single-entry,
  // dependency-free package anyway.
  dts: false,
  clean: true,
  sourcemap: true,
  treeshake: true,
  // No `external` needed and no `injectStyle`: this package imports nothing.
})
