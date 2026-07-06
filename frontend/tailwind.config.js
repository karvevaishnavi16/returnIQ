/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#342921', // Deep charcoal brown
          dark: '#1c1511',
          light: '#53453b'
        },
        accent: {
          green: '#D3E7D3', // soft green from screenshot
          red: '#F5DCDA',   // soft red
          amber: '#FDF1D6', // soft amber
        },
        background: '#FAF6F0', // Warm cream background
        surface: '#FFFFFF',
        text: {
          main: '#2C2520',
          muted: '#8A7D73'
        }
      }
    },
  },
  plugins: [],
}
