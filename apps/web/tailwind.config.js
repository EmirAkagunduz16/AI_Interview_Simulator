/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00bfa5',
          dark: '#00897b',
          light: 'rgba(0, 191, 165, 0.15)',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
