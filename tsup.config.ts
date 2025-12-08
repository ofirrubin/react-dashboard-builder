import { defineConfig } from 'tsup'

export default defineConfig([
  // React build
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom'],
    injectStyle: true,
    outDir: 'dist/react',
    esbuildOptions(options) {
      options.banner = {
        js: '"use client"',
      }
    },
  },
  // Preact build
  {
    entry: ['src/index.preact.ts'],
    format: ['cjs', 'esm'],
    dts: {
      compilerOptions: {
        jsx: 'react-jsx',
        jsxImportSource: 'preact',
      },
    },
    splitting: false,
    sourcemap: true,
    clean: false,
    external: ['preact', 'preact/hooks'],
    injectStyle: true,
    outDir: 'dist/preact',
    esbuildOptions(options) {
      options.banner = {
        js: '"use client"',
      }
      options.jsx = 'automatic'
      options.jsxImportSource = 'preact'
    },
  },
])
