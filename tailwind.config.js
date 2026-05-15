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
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
        // Semantic palette — referenced via Tailwind classes like text-reward,
        // bg-ai/15, border-primary/40, etc. Mirrors the --color-* CSS vars in
        // index.css so component code can use either Tailwind or raw vars.
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        reward: 'rgb(var(--color-reward) / <alpha-value>)',
        ai: 'rgb(var(--color-ai) / <alpha-value>)',
      },
      fontFamily: {
        // Display = Cal Sans / Plus Jakarta Sans, UI = Inter. Both resolve via
        // CSS vars so the index.css file is the single source of truth.
        display: ['var(--font-display)'],
        sans: ['var(--font-ui)'],
        ui: ['var(--font-ui)'],
        mono: ['ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
        rpg: ['Cinzel', 'Georgia', 'serif'],
      },
      // The brief's scale: tracking + weight bundled with each size so
      // typographic system stays consistent without per-call class soup.
      fontSize: {
        xs:   ['11px', { letterSpacing: '0.06em',  fontWeight: '500', lineHeight: '1.4' }],
        sm:   ['13px', { letterSpacing: '0.01em',  fontWeight: '400', lineHeight: '1.45' }],
        base: ['15px', {                            fontWeight: '400', lineHeight: '1.5' }],
        md:   ['17px', { letterSpacing: '-0.01em', fontWeight: '600', lineHeight: '1.4' }],
        lg:   ['22px', { letterSpacing: '-0.015em', fontWeight: '700', lineHeight: '1.3' }],
        xl:   ['28px', { letterSpacing: '-0.02em', fontWeight: '800', lineHeight: '1.2' }],
        '2xl':['34px', { letterSpacing: '-0.025em', fontWeight: '800', lineHeight: '1.15' }],
      },
      boxShadow: {
        // Mapped to CSS variables so dark-mode flips heavier shadows automatically.
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
        modal: 'var(--shadow-modal)',
        glow: '0 0 24px -4px rgb(var(--accent) / 0.6)',
        legendary: '0 0 36px -2px rgb(var(--legendary) / 0.7)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        // out is already a Tailwind default (ease-out) — kept for documentation.
      },
      transitionDuration: {
        80: '80ms',
        spring: '300ms',
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
        xpFloat: {
          '0%':   { transform: 'translateY(0) scale(0.95)',  opacity: '0' },
          '15%':  { transform: 'translateY(-4px) scale(1)',  opacity: '1' },
          '100%': { transform: 'translateY(-40px) scale(1)', opacity: '0' },
        },
        completeFlash: {
          '0%':   { background: 'rgb(34 197 94 / 0.18)' },
          '100%': { background: 'rgb(34 197 94 / 0)' },
        },
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)',   opacity: '1' },
          '50%':       { transform: 'scale(1.4)', opacity: '0.6' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.004)' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, 12px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
        skeletonShimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        flame: 'flame 1.4s ease-in-out infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        floatUp: 'floatUp 1s ease-out forwards',
        xpFloat: 'xpFloat 1.2s ease-out forwards',
        completeFlash: 'completeFlash 600ms ease-out forwards',
        pulseDot: 'pulseDot 1.6s ease-in-out infinite',
        breathe: 'breathe 3s ease-in-out infinite',
        toastIn: 'toastIn 200ms ease-out forwards',
        skeleton: 'skeletonShimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
}
