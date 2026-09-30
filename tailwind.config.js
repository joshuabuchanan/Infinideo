/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'times': ['Times New Roman', 'Times', 'serif'],
      },
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#3f0f5c',
        },
        accent: {
          cyan: '#06b6d4',
          purple: '#d946ef',
          green: '#84cc16',
          lime: '#a3e635',
        },
        dark: {
          bg: '#0a0e27',
          card: '#16213e',
          border: '#1a2847',
        },
      },
      fontSize: {
        '10xl': ['9rem', { lineHeight: '1' }],
      },
      backgroundImage: {
        'gradient-neon': 'linear-gradient(135deg, #d946ef 0%, #06b6d4 50%, #84cc16 100%)',
        'gradient-purple-cyan': 'linear-gradient(135deg, #a855f7 0%, #06b6d4 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(217, 70, 239, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
