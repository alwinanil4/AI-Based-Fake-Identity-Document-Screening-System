/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          base: '#FFFFFF',
          muted: '#F8F9FA',
          surface: '#F3F4F6',
          border: '#E5E7EB',
          borderSubtle: '#F3F4F6',
          textPrimary: '#111827',
          textSecondary: '#4B5563',
          textMuted: '#9CA3AF',
        },
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#EFF6FF',
          border: '#BFDBFE',
        },
        verdict: {
          genuine: '#059669',
          genuineBg: '#ECFDF5',
          genuineBorder: '#A7F3D0',
          suspicious: '#D97706',
          suspiciousBg: '#FFFBEB',
          suspiciousBorder: '#FDE68A',
          fake: '#DC2626',
          fakeBg: '#FEF2F2',
          fakeBorder: '#FECACA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
        lift: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
