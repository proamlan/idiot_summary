/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./popup.html",
    "./sidepanel.html",
    "./settings.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        chai: {
          50: '#fdf8f4',
          100: '#f9eee4',
          200: '#f3dcbe',
          300: '#eac593',
          400: '#e0a664',
          500: '#d78939',
          600: '#c56f2c',
          700: '#a35326',
          800: '#834225',
          900: '#6c3822',
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      }
    },
  },
  plugins: [],
}
