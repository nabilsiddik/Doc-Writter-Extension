/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: [
     "./src/**/*.{ts,tsx,html}",
    "./popup.tsx",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#6366f1", // Your Indigo
        secondary: "#a855f7", // Your Purple
      }
    }
  },
  plugins: []
}