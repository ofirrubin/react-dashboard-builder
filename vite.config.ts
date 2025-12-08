import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Default config for React playground (same as test:react)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  logLevel: 'info',
  clearScreen: false,
})

