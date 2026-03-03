/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bleu Autobat #10264d — toute la palette
        primary: {
          50:  '#f0f3f9',
          100: '#d9e0ef',
          200: '#b4c2df',
          300: '#8ea3cf',
          400: '#6985bf',
          500: '#3d5a9a',
          600: '#10264d', // Bleu principal Autobat
          700: '#0d1f3e',
          800: '#091630',
          900: '#060e1f',
        },
        // Override du blue Tailwind → même palette brand
        blue: {
          50:  '#f0f3f9',
          100: '#d9e0ef',
          200: '#b4c2df',
          300: '#8ea3cf',
          400: '#6985bf',
          500: '#3d5a9a',
          600: '#10264d', // Bleu principal Autobat
          700: '#0d1f3e',
          800: '#091630',
          900: '#060e1f',
        },
        // Override du gray Tailwind → palette #dcdcda
        gray: {
          50:  '#fafaf9',
          100: '#f4f4f3',
          200: '#dcdcda', // Gris principal Autobat
          300: '#c3c3c1',
          400: '#a8a8a6',
          500: '#8e8e8c',
          600: '#717170',
          700: '#575756',
          800: '#3e3e3d',
          900: '#262625',
        },
        secondary: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B', // Orange principal
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
