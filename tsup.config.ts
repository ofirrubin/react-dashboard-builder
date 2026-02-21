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
      resolve: true,
      compilerOptions: {
        jsx: 'react-jsx',
        jsxImportSource: 'preact',
        skipLibCheck: true,
      },
    },
    splitting: false,
    sourcemap: true,
    clean: false,
    external: ['preact', 'preact/hooks', 'preact/compat', 'preact/jsx-runtime', 'react', 'react-dom'],
    injectStyle: true,
    outDir: 'dist/preact',
    esbuildOptions(options) {
      options.banner = {
        js: '"use client"',
      }
      options.jsx = 'automatic'
      options.jsxImportSource = 'preact'
      options.alias = {
        ...(options.alias || {}),
        'react': 'preact/compat',
        'react-dom': 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react/jsx-runtime': 'preact/jsx-runtime'
      }
    },
  },
])
