module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    'tailwindcss': {}, // <--- برای Tailwind v3، باید 'tailwindcss': {} باشد
    'autoprefixer': {},
  },
};