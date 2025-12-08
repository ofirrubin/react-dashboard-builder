import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// Preact playground config
export default defineConfig({
  plugins: [preact()],
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      'react/jsx-runtime': 'preact/jsx-runtime'
    }
  },
  server: {
    port: 3001,
  },
  build: {
    outDir: 'dist-preact',
  },
  logLevel: 'info',
  clearScreen: false,
})

