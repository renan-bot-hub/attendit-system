// Tailwind configuration that defines scanned files and custom theme tokens.
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#9B0D2E',
        brand: {
          50: '#FFF5F7',
          100: '#FBE6EC',
          200: '#F3C6D1',
          300: '#E99CAF',
          400: '#D85E7A',
          500: '#B0183A',
          600: '#9B0D2E',
          700: '#7D0A25',
          800: '#5D091D',
          900: '#3A0712',
        },
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      }
    },
  },
  plugins: [],
}
