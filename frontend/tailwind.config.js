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
        terminal: {
          bg: "#080c14",
          card: "#0f172a",
          cardHover: "#1e293b",
          border: "#1e293b",
          borderSubtle: "#334155",
          cyan: "#06b6d4",
          emerald: "#10b981",
          gold: "#f59e0b",
          rose: "#f43f5e",
          muted: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
