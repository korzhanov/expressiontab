const sveltePreprocess = require("svelte-preprocess");

module.exports = {
    // Consult https://github.com/sveltejs/svelte-preprocess
    // for more information about preprocessors
//     preprocess: sveltePreprocess()
// }
preprocess: sveltePreprocess({
    defaults: {
      style: 'postcss',
    },
    postcss: true,
  }),
}

// import {sveltePreprocess} from 'svelte-preprocess'

// export default {
//   // Consult https://github.com/sveltejs/svelte-preprocess
//   // for more information about preprocessors
//   preprocess: sveltePreprocess()
// }
