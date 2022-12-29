/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        fadeColor: "fadeColor 1s ease-in-out"
      },

      keyframes: theme => ({
        fadeColor: {
          "0%": { backgroundColor: theme("colors.lime.100") },
          "100%": { backgroundColor: theme("colors.gray.100") }
        }
      })



    },
  },
  plugins: [],
}