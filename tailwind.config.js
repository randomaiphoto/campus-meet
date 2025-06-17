/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        googleBlue: '#4285F4',
        googleRed: '#EA4335',
        googleYellow: '#FBBC05',
        googleGreen: '#34A853'
      },
      ringOpacity: {
        DEFAULT: '0.5',
        '0': '0',
        '25': '0.25',
        '50': '0.5',
        '75': '0.75',
        '100': '1',
      }
    },
  },
  plugins: [],
}
