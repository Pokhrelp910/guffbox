/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cricket: {
          pitch: '#1b4332',
          gold: '#facc15',
          navy: '#0f172a',
          blue: '#1e3a8a',
          red: '#dc2626',
        }
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'dock-ball': 'dockBall 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        dockBall: {
          '0%': { transform: 'scale(1.8) translateY(-20px)', opacity: '0.2' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
