/** @type {import('tailwindcss').Config} */
import rudPreset from 'rud-dashboard/tailwind.preset'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/rud-dashboard/dist/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [rudPreset],
  theme: {
    extend: {},
  },
  plugins: [],
}
