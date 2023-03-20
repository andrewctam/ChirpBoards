/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        fadeColor: "fadeColor 1s ease-in-out"
      },

      keyframes: theme => ({
        fadeColor: {
          "0%": { backgroundColor: theme("colors.lime.900") },
          "100%": { backgroundColor: theme("#414545") }
        }
      })
    },
  },
  plugins: [],
}