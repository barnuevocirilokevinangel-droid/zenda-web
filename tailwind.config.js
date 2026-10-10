/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'zenda-dark': '#0B0F19',
        'zenda-blue': '#1E3A8A',
        'zenda-cyan': '#00E5FF',
        'zenda-muted': '#64748B',
        'zenda-border': '#E2E8F0',
        'zenda-surface': '#F8FAFC',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(11, 15, 25, 0.04), 0 1px 2px -1px rgba(11, 15, 25, 0.03)',
        'elevated': '0 10px 30px -5px rgba(11, 15, 25, 0.05), 0 4px 6px -2px rgba(11, 15, 25, 0.02)',
        'glow-cyan': '0 0 25px -5px rgba(0, 229, 255, 0.3)',
      },
      backgroundImage: {
        'grid-pattern': "radial-gradient(circle, #E2E8F0 1px, transparent 1px)",
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 35s linear infinite',
      },
    },
  },
  plugins: [],
}
