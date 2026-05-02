/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'daw-bg': '#090a10',
        'daw-surface': '#0d0e14',
        'daw-panel': '#111520',
        'daw-border': 'rgba(255,255,255,0.07)',
        'daw-cyan': '#22d3ee',
        'daw-violet': '#a855f7',
        'daw-rose': '#f43f5e',
        'daw-amber': '#fb923c',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'in': 'fadeIn 0.2s ease-out',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
