/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        surface2: 'rgb(var(--surface2) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        accent2: 'rgb(var(--accent2) / <alpha-value>)',
        career: 'rgb(var(--career) / <alpha-value>)',
        health: 'rgb(var(--health) / <alpha-value>)',
        relationships: 'rgb(var(--relationships) / <alpha-value>)',
        finance: 'rgb(var(--finance) / <alpha-value>)',
        learning: 'rgb(var(--learning) / <alpha-value>)',
        mind: 'rgb(var(--mind) / <alpha-value>)',
        common: 'rgb(var(--common) / <alpha-value>)',
        rare: 'rgb(var(--rare) / <alpha-value>)',
        epic: 'rgb(var(--epic) / <alpha-value>)',
        legendary: 'rgb(var(--legendary) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px -4px rgb(var(--accent) / 0.6)',
        legendary: '0 0 36px -2px rgb(var(--legendary) / 0.7)',
      },
      keyframes: {
        flame: {
          '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '50%': { transform: 'translateY(-2px) scale(1.08)', opacity: '0.85' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--accent) / 0.45)' },
          '50%': { boxShadow: '0 0 0 16px rgb(var(--accent) / 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-32px)', opacity: '0' },
        },
      },
      animation: {
        flame: 'flame 1.4s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        floatUp: 'floatUp 1s ease-out forwards',
      },
    },
  },
  plugins: [],
}
