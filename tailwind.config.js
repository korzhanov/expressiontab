module.exports = {
  purge: ['./index.html', './src/**/*.{svelte,js,ts}'],
  // purge: {
  //   content: [
  //     "./src/**/*.svelte",
  //   ],
  //   enabled: production // disable purge in dev
  // },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
  future: {
    purgeLayersByDefault: true,
    removeDeprecatedGapUtilities: true,
  }
}
