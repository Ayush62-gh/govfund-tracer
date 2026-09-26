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
        gov: {
          navy: '#0A2540',
          navyDark: '#061626',
          blue: '#1E4E8C',
          lightBlue: '#E8F1FC',
          saffron: '#FF671F',
          saffronLight: '#FFF2EB',
          green: '#046A38',
          greenLight: '#E6F4EA',
          slate: '#334155',
          border: '#E2E8F0',
          card: '#FFFFFF',
          bg: '#F8FAFC',
        },
        risk: {
          low: {
            DEFAULT: '#10B981',
            bg: '#ECFDF5',
            border: '#A7F3D0',
            text: '#065F46',
            dark: '#059669',
          },
          medium: {
            DEFAULT: '#F59E0B',
            bg: '#FFFBEB',
            border: '#FDE68A',
            text: '#92400E',
            dark: '#D97706',
          },
          high: {
            DEFAULT: '#EF4444',
            bg: '#FEF2F2',
            border: '#FECACA',
            text: '#991B1B',
            dark: '#DC2626',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'gov': '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
        'gov-md': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
        'gov-lg': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.35)',
        'glow-amber': '0 0 15px rgba(245, 158, 11, 0.35)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
