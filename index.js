/**
 * @module index
 * @license MIT
 * @author nuintun
 * @version 2018/05/17
 * @description Webpack plugin for generating an asset manifest with grouped entry chunks.
 * @see https://github.com/jakedahm/webpack-asset-manifest-plugin
 */

const fs = require('fs-extra');
const path = require('path');

/**
 * @function unixify
 * @description Convert path separators to posix/unix-style forward slashes.
 * @param {string} path
 * @returns {string}
 */
function unixify(path) {
  return path.replace(/\\/g, '/');
}

/**
 * @class WebpackEntryManifestPlugin
 */
class WebpackEntryManifestPlugin {
  /**
   * @constructor
   * @param {Object} options
   */
  constructor(options) {
    this.name = 'WebpackEntryManifestPlugin';
    this.options = Object.assign(
      {
        basePath: null,
        outputPath: null,
        publicPath: null,
        filename: 'manifest.json',
        serialize: manifest => JSON.stringify(manifest, null, 2)
      },
      options
    );
  }

  /**
   * @private
   * @method generateManifest
   * @param {Compiler} compiler
   * @param {Compilation} compilation
   */
  generateManifest(compiler, compilation) {
    const options = this.options;
    const basePath = options.basePath || '';
    const publicPath = options.publicPath || compiler.options.output.publicPath;

    // Get manifest
    const manifest = compilation.chunkGroups.reduce((manifest, group) => {
      if (group.name) {
        const chunks = group.chunks;
        const name = basePath + group.name;
        const groupFiles = group.getFiles().map(file => publicPath + file);

        manifest[name] = {
          files: groupFiles,
          chunks: group.getChildren().reduce((chunks, chunk) => {
            const files = chunk.chunks.reduce((items, item) => {
              item.files.forEach(file => {
                const item = publicPath + file;

                if (chunks.indexOf(item) === -1 && groupFiles.indexOf(item) === -1) {
                  items.push(publicPath + file);
                }
              });

              return items;
            }, []);

            return chunks.concat(files);
          }, [])
        };
      }

      return manifest;
    }, Object.create(null));

    const outputPath = options.outputPath || compiler.outputPath;
    const outputFile = path.resolve(outputPath, options.filename);

    fs.outputFileSync(outputFile, options.serialize(manifest));
  }

  apply(compiler) {
    const emit = compilation => this.generateManifest(compiler, compilation);

    if (compiler.hooks) {
      compiler.hooks.emit.tap({ name: this.name, stage: Infinity }, emit);
    } else {
      compiler.plugin('emit', emit);
    }
  }
}

module.exports = WebpackEntryManifestPlugin;
