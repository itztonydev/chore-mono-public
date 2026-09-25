/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    // Strictly disable all rounded corners globally
    borderRadius: {
      none: '0px',
      DEFAULT: '0px',
      sm: '0px',
      md: '0px',
      lg: '0px',
      xl: '0px',
      '2xl': '0px',
      '3xl': '0px',
      full: '0px',
    },
    extend: {
      colors: {
        // Tokyo Night modified for pure black brutalism
        canvas: '#000000',
        surface: {
          DEFAULT: '#16161E',
          card: '#16161E',
          dark: '#0d0e15',
          black: '#000000',
        },
        border: {
          DEFAULT: '#565f89',
          inactive: '#565f89',
          active: '#c0caf5',
          faint: '#24283b',
        },
        tokyo: {
          bg: '#000000',
          surface: '#16161E',
          line: '#565f89',
          faint: '#24283b',
          text: '#c0caf5',
          muted: '#9aa5ce',
          white: '#ffffff',
          cyan: '#7dcfff',
          purple: '#bb9af7',
          green: '#9ece6a',
          red: '#f7768e',
          yellow: '#e0af68',
          orange: '#ff9e64',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'Inter', 'Helvetica Neue', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Space Mono"', 'monospace'],
        grotesk: ['"Space Grotesk"', 'sans-serif'],
      },
      borderWidth: {
        '1': '1px',
        '2': '2px',
        '3': '3px',
        '4': '4px',
        '6': '6px',
      },
      // Non-blurred solid offset block shadows
      boxShadow: {
        'brutal-purple': '4px 4px 0px #bb9af7',
        'brutal-cyan': '4px 4px 0px #7dcfff',
        'brutal-green': '4px 4px 0px #9ece6a',
        'brutal-red': '4px 4px 0px #f7768e',
        'brutal-white': '4px 4px 0px #ffffff',
        'brutal-yellow': '4px 4px 0px #e0af68',
        'brutal-sm-cyan': '2px 2px 0px #7dcfff',
        'brutal-sm-purple': '2px 2px 0px #bb9af7',
        'brutal-sm-green': '2px 2px 0px #9ece6a',
        'brutal-sm-red': '2px 2px 0px #f7768e',
        'brutal-lg-purple': '6px 6px 0px #bb9af7',
        'brutal-lg-cyan': '6px 6px 0px #7dcfff',
        'brutal-lg-green': '6px 6px 0px #9ece6a',
        'brutal-offset-black': '4px 4px 0px #000000',
      },
    },
  },
  plugins: [],
};
