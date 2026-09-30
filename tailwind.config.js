/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Core dark palette
        surface: {
          DEFAULT: '#0a0a0f',
          50: '#0e0e14',
          100: '#13131a',
          200: '#1a1a24',
          300: '#22222e',
          400: '#2d2d3a',
        },
        // Accent — electric teal/cyan
        accent: {
          DEFAULT: '#00e5cc',
          dim: '#00b8a3',
          bright: '#33ffeb',
          glow: 'rgba(0, 229, 204, 0.15)',
        },
        // Secondary accent — warm amber for warnings/CTAs
        warm: {
          DEFAULT: '#f59e0b',
          dim: '#d97706',
          bright: '#fbbf24',
        },
        // Text
        text: {
          primary: '#f0f0f5',
          secondary: '#8888a0',
          muted: '#55556a',
        },
        // Status
        fit: {
          strong: '#00e5cc',
          stretch: '#f59e0b',
          skip: '#ef4444',
        },
      },
      fontFamily: {
        display: ['"Cabinet Grotesk"', '"DM Sans"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(0, 229, 204, 0.2)',
        'glow-lg': '0 0 40px rgba(0, 229, 204, 0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 229, 204, 0.1)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 229, 204, 0.25)' },
        },
      },
    },
  },
  plugins: [],
}
