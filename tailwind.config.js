/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],

  // Required by NativeWind v4
  presets: [require('nativewind/preset')],

  theme: {
    extend: {
      colors: {
        seedlings: '#8CC63F',
        paper: '#FAF7F1',
        orange: '#EF8F2A',
      },
    },
  },

  plugins: [],
};