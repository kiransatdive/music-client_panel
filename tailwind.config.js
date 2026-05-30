/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#00aeef',
          hover: '#009dcb',
          light: '#e6f7fe',
        },
        secondary: '#0f172a',
        accent: '#0ea5e9',
        dark: {
          bg: '#080c14',
          card: '#0f172a',
          border: '#1e293b',
          input: '#1e293b',
          hover: '#1e293b',
        },
        rose: {
          50: '#e6f7fe',
          100: '#cceefd',
          200: '#99ddfb',
          300: '#66ccf9',
          400: '#33bbf7',
          500: '#00aeef',
          600: '#009dcb',
          700: '#007ca0',
          800: '#005c77',
          900: '#003b4d',
          950: '#001c24',
        },
        violet: {
          50: '#f5f8ff',
          100: '#ebf1ff',
          200: '#d6e3ff',
          300: '#adc7ff',
          400: '#85abff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      boxShadow: {
        DEFAULT: '0 1px 3px 0 rgba(0, 174, 239, 0.1), 0 1px 2px -1px rgba(0, 174, 239, 0.1)',
        sm: '0 1px 2px 0 rgba(0, 174, 239, 0.05)',
        md: '0 4px 6px -1px rgba(0, 174, 239, 0.12), 0 2px 4px -2px rgba(0, 174, 239, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 174, 239, 0.15), 0 4px 6px -4px rgba(0, 174, 239, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 174, 239, 0.2), 0 8px 10px -6px rgba(0, 174, 239, 0.15)',
        '2xl': '0 25px 50px -12px rgba(0, 174, 239, 0.35)',
        'soft': '0 8px 30px rgba(0, 174, 239, 0.08), 0 2px 8px rgba(0, 174, 239, 0.04)',
        'soft-lg': '0 16px 40px rgba(0, 174, 239, 0.12), 0 4px 16px rgba(0, 174, 239, 0.06)',
        'soft-dark': '0 8px 30px rgba(0, 174, 239, 0.2), 0 2px 8px rgba(0, 174, 239, 0.15)',
      },
    },
  },
  plugins: [],
}
