/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI Variable', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        sand: {
          50: '#fdfbf7',
          100: '#f8f4e6',
          200: '#efe6c8',
          300: '#e3d2a1',
          400: '#d5b977',
          500: '#caa357',
          600: '#b28643',
          700: '#8e6536',
          800: '#775231',
          900: '#64442a',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F3E5AB'
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
