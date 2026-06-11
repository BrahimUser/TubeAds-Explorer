/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        // Brand orange used by header CTA + promo banner.
        brand: {
          50: '#fff5ed',
          100: '#ffe6d2',
          200: '#ffc8a0',
          300: '#ffa56b',
          400: '#ff8540',
          500: '#f76b1c',
          600: '#e15510',
          700: '#b8400d',
          800: '#923310',
          900: '#762c11',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.06)',
        cardHover: '0 8px 24px rgba(15,23,42,0.10)',
      },
    },
  },
  plugins: [],
};
