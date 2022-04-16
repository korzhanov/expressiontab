// eslint-disable-next-line @typescript-eslint/no-var-requires
const sveltePreprocess = require("svelte-preprocess");

module.exports = {
  preprocess: sveltePreprocess({
    // defaults: {
    //   style: 'postcss',
    // },
    // postcss: true,
  }),
  // emitCss: false,
  // css: css => {
  //   css.write('bundle.css')
  // },
  // cssHash:true,

}