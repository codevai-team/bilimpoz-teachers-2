/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0b0b0b',
        'card-background': '#151515',
        'secondary-bg': '#242424',
        'hover-bg': '#363636',
        'hover-light': '#1a1a1a',
        'hover-medium': '#2a2a2a',
        foreground: '#ffffff',
        'text-gray-300': '#d1d5db',
        'text-gray-400': '#9ca3af',
        'text-gray-500': '#6b7280',
        'accent-white': '#ffffff',
        'accent-red': '#ef4444',
        'accent-red-hover': '#dc2626',
        'accent-yellow': '#eab308',
        'accent-yellow-hover': '#ca8a04',
        'accent-green': '#22c55e',
        'accent-blue': '#3b82f6',
        'border-gray': '#4a5565',
        'border-gray-light': '#374151',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Arial', 'Helvetica', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
}






