/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        halloumi: "#F8F9FA",
        deepsea: "#006994",
        emergency: "#FF5F1F",
      },
    },
  },
  plugins: [],
}
