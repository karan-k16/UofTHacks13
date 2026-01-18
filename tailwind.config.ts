import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pulse Studio Dark Theme
        'ps-bg': {
          900: '#0d0d0d',
          800: '#141414',
          700: '#1a1a1a',
          600: '#242424',
          500: '#2d2d2d',
          400: '#3a3a3a',
        },
        'ps-accent': {
          primary: '#ff6b35',
          secondary: '#4ecdc4',
          tertiary: '#ffe66d',
          purple: '#9b59b6',
          blue: '#3498db',
          green: '#27ae60',
          red: '#e74c3c',
        },
        'ps-text': {
          primary: '#e8e8e8',
          secondary: '#a0a0a0',
          muted: '#666666',
        },
        'ps-grid': {
          line: '#2a2a2a',
          beat: '#3a3a3a',
          bar: '#4a4a4a',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      spacing: {
        '0.5': '2px',
        '18': '4.5rem',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'meter': 'meter 50ms linear',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      boxShadow: {
        'glow-orange': '0 0 10px rgba(255, 107, 53, 0.5)',
        'glow-cyan': '0 0 10px rgba(78, 205, 196, 0.5)',
        'inner-dark': 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;

