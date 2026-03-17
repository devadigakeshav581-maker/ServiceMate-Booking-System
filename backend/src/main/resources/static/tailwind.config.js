/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        panel: 'var(--panel)',
        accent: 'var(--accent)',
        'accent-glow': 'var(--accent-glow)',
        accent2: 'var(--accent2)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        'input-bg': 'var(--input-bg)',
        error: 'var(--error)',
        success: 'var(--success)',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        epilogue: ['Epilogue', 'sans-serif'],
      }
    },
  },
  plugins: [],
}