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
          "0%": { backgroundColor: theme("colors.lime.800") },
          "100%": { backgroundColor: theme("#414545") }
        }
      })



    },
  },
  plugins: [],
}