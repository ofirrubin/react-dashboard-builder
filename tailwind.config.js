import rudPreset from './tailwind.preset.js'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [rudPreset],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./playground/**/*.{js,ts,jsx,tsx}",
    "./index.html",
    "./index-preact.html"
  ],
}

