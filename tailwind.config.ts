import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        forest: '#0F1A12',
        forest2: '#1A2E1F',
        accent: '#A8FF3E',
        chalk: '#F5F0E8',
        dawn: '#EAD9C2',
        ink: '#111111',
        mist: '#667070',
        card: '#EDE8DF',
      },
      fontFamily: {
        display: ["'Barlow Condensed'", 'sans-serif'],
        sans: ["'Inter'", 'sans-serif'],
        mono: ["'JetBrains Mono'", 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
