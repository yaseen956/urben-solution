/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      colors: {
        ink: '#111827',
        coral: '#fb5d4f',
        mint: '#10b981',
        cloud: '#f8fafc'
      }
    }
  },
  plugins: []
};
