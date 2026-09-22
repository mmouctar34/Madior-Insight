/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        copper: { DEFAULT:'#C4621A', light:'#D97732', bg:'rgba(196,98,26,0.09)' },
        cream:  '#FDFCF8',
        dark:   '#2C1A0E',
      },
      fontFamily: {
        fredoka: ['Fredoka','sans-serif'],
        nunito:  ['Nunito','sans-serif'],
        mono:    ['"Space Mono"','monospace'],
      },
    },
  },
  plugins: [],
}
