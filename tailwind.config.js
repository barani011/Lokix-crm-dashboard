/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        lokix: {
          bg: '#100A06',
          sidebar: '#17120F',
          card: '#24170F',
          primary: '#A94F1D',
          secondary: '#F5B942',
          text: '#FFFFFF',
          muted: '#A6A09A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
