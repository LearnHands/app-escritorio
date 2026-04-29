/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
        display: ['"Fredoka One"', 'cursive'],
      },
      colors: {
        edu: {
          purple:  '#7C3AED',
          violet:  '#8B5CF6',
          indigo:  '#4F46E5',
          blue:    '#2563EB',
          cyan:    '#06B6D4',
          teal:    '#0D9488',
          green:   '#10B981',
          lime:    '#84CC16',
          yellow:  '#F59E0B',
          orange:  '#F97316',
          red:     '#EF4444',
          pink:    '#EC4899',
        },
        dark: {
          900: '#0A0A1A',
          800: '#0F0F2D',
          700: '#151535',
          600: '#1E1E4A',
          500: '#2D2D6B',
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pop': 'pop 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
        'dwell': 'dwell 0.8s ease-in-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pop: {
          '0%':   { transform: 'scale(0.8)', opacity: '0' },
          '80%':  { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)',   opacity: '1' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(124,58,237,0.5)' },
          '50%':      { boxShadow: '0 0 25px rgba(124,58,237,1), 0 0 50px rgba(139,92,246,0.5)' },
        },
        dwell: {
          '0%':   { strokeDashoffset: '283' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
