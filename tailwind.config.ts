import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sci-blue': '#00A3FF',
        'sci-teal': '#00E5C9',
        'sci-cyan': '#00BCD4',
        'sci-dark-blue': '#1976D2',
        'background': 'var(--background)',
        'foreground': 'var(--foreground)',
        'card': 'var(--card-background)',
        'border': 'var(--border)',
        'primary': 'var(--primary)',
        'secondary': 'var(--secondary)',
        'accent': 'var(--accent)',
        'muted': 'var(--muted)',
      },
    },
  },
  plugins: [],
}

export default config