/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        krumly: {
          red: '#AA1616',
          'red-dark': '#8D0F0F',
          cream: '#FFF3E8',
          chocolate: '#1A0A0A',
          moka: '#665353',
          border: '#EEDCD0',
        }
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
