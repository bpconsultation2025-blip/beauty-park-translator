/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FAF6EF',
        cream2: '#F3EADB',
        bronze: '#C9A77C',
        coffee: '#8B6F47',
        espresso: '#3D2E1F',
        ink: '#2A1F14',
        sage: '#A8C49A',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Cormorant Garamond', 'serif'],
        serifKR: ['var(--font-serif-kr)', 'Noto Serif KR', 'serif'],
        sansKR: ['var(--font-sans-kr)', 'Noto Sans KR', 'sans-serif'],
        serifJP: ['"Hiragino Mincho ProN"', '"Yu Mincho"', 'serif'],
        serifSC: ['var(--font-serif-sc)', '"Noto Serif SC"', 'serif'],
      },
    },
  },
  plugins: [],
};
