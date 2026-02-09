/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          'from': { 'box-shadow': '0 0 10px #f0abfc, 0 0 20px #f0abfc' },
          'to': { 'box-shadow': '0 0 20px #f0abfc, 0 0 40px #f0abfc' },
        }
      }
    },
  },
  plugins: [],
}
