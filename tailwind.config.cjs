/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-gold': '#fbbf24',
        'cricket-green': '#064e3b'
      },
      fontFamily: {
        broadcast: ['Teko', 'system-ui', 'sans-serif'],
        sans: ['Outfit', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
