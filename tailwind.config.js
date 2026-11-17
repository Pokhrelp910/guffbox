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
          neon: '#00f5ff',
          accent: '#ff6b35',
        }
      },
      backgroundImage: {
        'tv-dark': 'linear-gradient(135deg, #060a14 0%, #0d1529 50%, #060a14 100%)',
        'gold-shine': 'linear-gradient(90deg, #b8860b, #facc15, #fde68a, #facc15, #b8860b)',
        'score-gradient': 'linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-left': 'slideInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'dock-ball': 'dockBall 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        'score-flash': 'scoreFlash 0.5s ease-out',
        'wicket-shake': 'wicketShake 0.6s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'ticker-scroll': 'tickerScroll 20s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'zoom-in': 'zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        slideDown: {
          '0%': { transform: 'translateY(-120%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(120%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        dockBall: {
          '0%': { transform: 'scale(2.2) translateY(-24px)', opacity: '0' },
          '60%': { transform: 'scale(0.9) translateY(2px)', opacity: '1' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        scoreFlash: {
          '0%': { transform: 'scale(1.3)', color: '#facc15' },
          '100%': { transform: 'scale(1)', color: 'inherit' },
        },
        wicketShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(250, 204, 21, 0.4)' },
          '50%': { boxShadow: '0 0 35px rgba(250, 204, 21, 0.9), 0 0 70px rgba(250, 204, 21, 0.4)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      fontFamily: {
        display: ['Teko', 'Impact', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'neon-gold': '0 0 20px rgba(250, 204, 21, 0.6), 0 0 60px rgba(250, 204, 21, 0.2)',
        'neon-blue': '0 0 20px rgba(14, 165, 233, 0.6), 0 0 60px rgba(14, 165, 233, 0.2)',
        'neon-red': '0 0 20px rgba(239, 68, 68, 0.7), 0 0 60px rgba(239, 68, 68, 0.3)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.7), 0 0 60px rgba(168, 85, 247, 0.3)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08)',
        'broadcast': '0 25px 60px rgba(0,0,0,0.9), 0 10px 20px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
}
