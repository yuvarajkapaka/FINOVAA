/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#F2F0E8', // Primary background
          subtle: '#E8E6DC',  // Secondary background
          white: '#FFFFFF',   // White surface
        },
        forest: {
          DEFAULT: '#254B3B', // Primary forest green
          light: '#315F4B',
          dark: '#1C382C',
        },
        sage: {
          DEFAULT: '#A8B39A', // Secondary sage
          light: '#BAC3AF',
          dark: '#8E9A80',
        },
        olive: {
          DEFAULT: '#777F59', // Muted olive
          light: '#919B6F',
        },
        copper: {
          DEFAULT: '#C87952', // Warm copper
          light: '#D98F6B',
          dark: '#AC613D',
        },
        gold: {
          DEFAULT: '#D8C18A', // Soft gold
          light: '#E6D4AA',
        },
        ink: {
          DEFAULT: '#252923', // Primary text
          muted: '#73766D',   // Secondary text
          subtle: '#9A9C94',
        },
        edge: {
          DEFAULT: '#DCDDD4', // Border
          dark: '#C8C9BF',
        },
        pos: {
          DEFAULT: '#397A57', // Positive indicator
        },
        neg: {
          DEFAULT: '#BD604B', // Negative indicator
        }
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
