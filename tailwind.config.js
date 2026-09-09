/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        security: {
          dark: '#0B0F19',
          card: '#111827',
          cardBorder: '#1F2937',
          accent: '#3B82F6',
          accentGlow: '#60A5FA',
        },
        status: {
          genuine: '#10B981',
          suspicious: '#F59E0B',
          fake: '#EF4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
