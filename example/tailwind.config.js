import rudPreset from 'rud-dashboard/tailwind.preset'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [rudPreset],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/rud-dashboard/**/*.{js,ts,jsx,tsx}"
  ],
}

