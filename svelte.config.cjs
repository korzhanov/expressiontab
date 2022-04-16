// eslint-disable-next-line @typescript-eslint/no-var-requires
const sveltePreprocess = require("svelte-preprocess");

module.exports = {
  // experimental: {
  //   useVitePreprocess: true
  // },
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  //     preprocess: sveltePreprocess()
  // }
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

// import {sveltePreprocess} from 'svelte-preprocess'

// export default {
//   // Consult https://github.com/sveltejs/svelte-preprocess
//   // for more information about preprocessors
//   preprocess: sveltePreprocess()
// }
