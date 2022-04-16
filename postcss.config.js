module.exports = {
  syntax: 'postcss-scss',
  parser: 'postcss-scss',
  inject: true,
  plugins: {
    autoprefixer: {},
    "postcss-nested":{},
  },
}