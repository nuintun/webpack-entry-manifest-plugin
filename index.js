/**
 * @module index
 * @license MIT
 * @author nuintun
 * @version 2018/05/17
 * @description Webpack plugin for generating an asset manifest with grouped entry chunks.
 * @see https://github.com/jakedahm/webpack-asset-manifest-plugin
 */

const path = require('path');
const fs = require('fs-extra');

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
        map: null,
        chunks: false,
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
   * @method extname
   * @param {string} file
   * @returns {string}
   */
  extname(file) {
    return path.extname(file).toLowerCase();
  }

  /**
   * @private
   * @method generateManifest
   * @param {Compiler} compiler
   * @param {Compilation} compilation
   * @param {Function} next
   */
  generateManifest(compiler, compilation, next) {
    const options = this.options;
    const basePath = options.basePath || '';
    const map = typeof options.map === 'function' ? options.map : file => file;
    const publicPath = options.publicPath || compiler.options.output.publicPath;

    // Get manifest
    const manifest = compilation.chunkGroups.reduce((manifest, group) => {
      if (group.name) {
        const js = [];
        const css = [];
        const initial = new Set();
        const chunks = group.chunks;
        const name = basePath + group.name;

        // Walk main chunks
        for (const chunk of chunks) {
          for (let file of chunk.files) {
            if (!initial.has(file)) {
              initial.add(file);

              file = publicPath + file;
              file = String(map(file, chunk));

              switch (this.extname(file)) {
                case '.js':
                  js.push(file);
                  break;
                case '.css':
                  css.push(file);
                  break;
                default:
                  break;
              }
            }
          }
        }

        // Set js css
        manifest[name] = { js, css };

        // Set chunks
        if (options.chunks) {
          const children = new Set();

          // Walk async chunks
          manifest[name].chunks = group.getChildren().reduce((chunks, chunk) => {
            chunk.chunks.forEach(chunk => {
              chunk.files.forEach(file => {
                if (!children.has(file) && !initial.has(file)) {
                  children.add(file);

                  file = publicPath + file;
                  file = String(map(file, chunk));

                  chunks.push(file);
                }
              });
            });

            return chunks;
          }, []);
        }
      }

      return manifest;
    }, Object.create(null));

    // Get paths
    const outputPath = options.outputPath || compiler.outputPath;
    const outputFile = path.resolve(outputPath, options.filename);

    // Write manifest file
    fs
      .outputFile(outputFile, options.serialize(manifest))
      .then(result => next())
      .catch(error => next(error));
  }

  /**
   * @method apply
   * @param {Compiler} compiler
   */
  apply(compiler) {
    const emit = (compilation, next) => this.generateManifest(compiler, compilation, next);

    if (compiler.hooks) {
      compiler.hooks.emit.tapAsync(this.name, emit);
    } else {
      compiler.plugin('emit', emit);
    }
  }
}

// Exports
module.exports = WebpackEntryManifestPlugin;
