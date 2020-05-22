# webpack-entry-manifest-plugin

> Webpack plugin for generating an asset manifest with grouped entry chunks
>
> [![NPM Version][npm-image]][npm-url]
> [![Download Status][download-image]][npm-url]
> ![Node Version][node-image]
> [![Dependencies][david-image]][david-url]

# Usage

```js
const WebpackEntryManifestPlugin = require('webpack-entry-manifest-plugin');

module.exports = {
  // ... Webpack configure
  plugins: [
    // ... Webpack plugins
    new WebpackEntryManifestPlugin({
      filename: 'manifest.json', // Assets manifest filename
      map: (path, chunk) => path, // Assets path map function
      filter: (path, chunk) => true, // Assets path filter function
      serialize: manifest => JSON.stringify(manifest) // Assets manifest serialize function
    })
  ]
};
```

# Output

```json
{
  "pages/index": {
    "js": [
      "/Assets/dist/js/runtime.js",
      "/Assets/dist/js/react.js",
      "/Assets/dist/js/vendors.js",
      "/Assets/dist/js/antd.js",
      "/Assets/dist/js/index.js"
    ],
    "css": ["/Assets/dist/css/antd.css", "/Assets/dist/css/index.css"]
  },
  "pages/login/index": {
    "js": [
      "/Assets/dist/js/runtime.js",
      "/Assets/dist/js/react.js",
      "/Assets/dist/js/vendors.js",
      "/Assets/dist/js/antd.js",
      "/Assets/dist/js/login/index.js"
    ],
    "css": ["/Assets/dist/css/antd.css", "/Assets/dist/css/login/index.css"]
  },
  "pages/user/index": {
    "js": [
      "/Assets/dist/js/runtime.js",
      "/Assets/dist/js/react.js",
      "/Assets/dist/js/vendors.js",
      "/Assets/dist/js/antd.js",
      "/Assets/dist/js/user/index.js"
    ],
    "css": ["/Assets/dist/css/antd.css", "/Assets/dist/css/user/index.css"]
  }
}
```

# License

[MIT](LICENSE)

[david-image]: http://img.shields.io/david/nuintun/webpack-entry-manifest-plugin.svg?style=flat-square
[david-url]: https://david-dm.org/nuintun/webpack-entry-manifest-plugin
[node-image]: http://img.shields.io/node/v/webpack-entry-manifest-plugin.svg?style=flat-square
[npm-image]: http://img.shields.io/npm/v/webpack-entry-manifest-plugin.svg?style=flat-square
[npm-url]: https://www.npmjs.org/package/webpack-entry-manifest-plugin
[download-image]: http://img.shields.io/npm/dm/webpack-entry-manifest-plugin.svg?style=flat-square
