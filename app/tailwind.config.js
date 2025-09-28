/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0a7cff',
        danger: '#f04438',
        success: '#12b76a',
      },
    },
  },
  plugins: [],
};
