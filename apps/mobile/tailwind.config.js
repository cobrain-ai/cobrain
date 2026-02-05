/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          light: '#3b82f6',
        },
        surface: {
          DEFAULT: '#f9fafb',
          secondary: '#f3f4f6',
          dark: '#1e293b',
        },
        background: {
          DEFAULT: '#ffffff',
          dark: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}
