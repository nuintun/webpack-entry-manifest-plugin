/**
 * @module index
 * @license MIT
 * @author nuintun
 * @version 2018/05/17
 * @description Webpack plugin for generating an asset manifest with grouped entry chunks.
 */

const path = require('path');
const fs = require('fs-extra');

/**
 * @function isFunction
 * @param {any} value
 * @returns {boolean}
 */
function isFunction(value) {
  return typeof value === 'function';
}

/**
 * @function unixify
 * @description Convert path separators to posix/unix-style forward slashes.
 * @param {string} path
 * @returns {string}
 */
function unixify(path) {
  return path.replace(/\\/g, '/');
}

// Default configure function
const map = file => file;
const serialize = manifest => JSON.stringify(manifest, null, 2);

/**
 * @class WebpackEntryManifestPlugin
 */
class WebpackEntryManifestPlugin {
  /**
   * @constructor
   * @param {Object} options
   */
  constructor(options) {
    this.options = Object.assign(
      {
        map: null,
        basePath: null,
        outputPath: null,
        publicPath: null,
        serialize: null,
        filename: 'manifest.json'
      },
      options
    );

    this.name = 'WebpackEntryManifestPlugin';
    this.options.basePath = this.options.basePath || '';
    this.options.map = isFunction(this.options.map) ? this.options.map : map;
    this.options.serialize = isFunction(this.options.serialize) ? this.options.serialize : serialize;
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
   * @method entrypoints
   * @param {Compilation} compilation
   * @returns {Map}
   */
  entrypoints(compilation) {
    const entrypoints = compilation.entrypoints;

    // Webpack 4
    if (entrypoints instanceof Map) {
      return entrypoints;
    }

    // Entries map
    const entries = new Map();

    // Webpack 2-3
    for (const entry in entrypoints) {
      entries.set(entry, entrypoints[entry]);
    }

    return entries;
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
    const basePath = options.basePath;
    const outputPath = options.outputPath || compiler.outputPath;
    const publicPath = options.publicPath || compiler.options.output.publicPath;

    // Map function
    const map = options.map;
    // Serialize function
    const serialize = options.serialize;
    // Define manifest
    const manifest = Object.create(null);
    // Get entrypoints
    const entrypoints = this.entrypoints(compilation);

    // Get manifest
    entrypoints.forEach((entrypoint, name) => {
      const js = [];
      const css = [];
      const initials = new Set();
      const chunks = entrypoint.chunks;

      // Walk main chunks
      for (const chunk of chunks) {
        for (let file of chunk.files) {
          if (!initials.has(file)) {
            initials.add(file);

            // Get extname
            const ext = this.extname(file);

            // Get file path
            file = publicPath + file;
            file = String(map(file, chunk));

            // Type classification
            switch (ext) {
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

      name = basePath + name;
      manifest[name] = { js, css };
    });

    // Get paths
    const filename = options.filename;
    const outputFile = path.resolve(outputPath, filename);

    // Manifest source
    const source = serialize(manifest);
    const buffer = Buffer.from(source);

    // Add to assets
    compilation.assets[unixify(filename)] = {
      source: () => source,
      size: () => Buffer.byteLength(buffer)
    };

    // Write manifest file
    fs
      .outputFile(outputFile, buffer)
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
