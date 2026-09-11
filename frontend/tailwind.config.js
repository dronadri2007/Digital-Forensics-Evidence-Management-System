/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aegis: {
          bg: '#080A0C',
          surface: '#0D1117',
          elevated: '#131822',
          card: 'rgba(13, 17, 23, 0.75)',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(255, 255, 255, 0.16)',
          text: '#EDEAE3',
          ivory: '#EDEAE3',
          sage: '#6B9B85',
          'sage-soft': 'rgba(107, 155, 133, 0.12)',
          'sage-border': 'rgba(107, 155, 133, 0.3)',
          'sage-light': '#7DA995',
          muted: '#8E8D88',
          faint: '#63625E',
          accent: '#6B9B85',
          'accent-soft': 'rgba(107, 155, 133, 0.12)',
        },
        light: {
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          elevated: '#F1F5F9',
          border: '#E2E8F0',
          text: '#121514',
          muted: '#63625E',
        }
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Bricolage Grotesque"', '"Fraunces"', '"Archivo"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'tightest': '-0.035em',
        'tighter': '-0.025em',
        'tight': '-0.015em',
        'widest-institutional': '0.18em',
        'ultra-wide': '0.25em',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
