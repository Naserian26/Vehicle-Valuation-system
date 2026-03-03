/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kevalRed: '#DA3832',
        kevalBlack: '#000000',
      },
    },
  },
  plugins: [],
}