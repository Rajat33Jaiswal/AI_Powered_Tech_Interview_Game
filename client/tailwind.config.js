/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brandBg: '#090d16',
        brandCard: 'rgba(17, 25, 40, 0.65)',
        brandBorder: 'rgba(255, 255, 255, 0.08)',
        neonIndigo: '#6366f1',
        neonViolet: '#8b5cf6',
        neonGreen: '#10b981',
        neonRed: '#f43f5e',
      },
      fontFamily: {
        outfit: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-indigo': '0 0 15px rgba(99, 102, 241, 0.4)',
        'glow-violet': '0 0 15px rgba(139, 92, 246, 0.4)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 15px rgba(244, 63, 94, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
    },
  },
  plugins: [],
}
