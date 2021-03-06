/**
 * @module index
 * @license MIT
 * @author nuintun
 * @description Webpack plugin for generating an asset manifest with grouped entry chunks.
 */

const { RawSource } = require('webpack-sources');
const { extname, isAbsolute, normalize, relative } = require('path');

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

function getAssetName(outputPath, filename) {
  if (isAbsolute(filename)) {
    return unixify(relative(outputPath, filename));
  }

  return unixify(normalize(filename));
}

// Default configure function
const map = path => path;
const filter = () => true;
const serialize = manifest => JSON.stringify(manifest);

/**
 * @class WebpackEntryManifestPlugin
 */
class WebpackEntryManifestPlugin {
  /**
   * @constructor
   * @param {Object} options
   */
  constructor(options) {
    options = { ...options };

    options.filename = options.filename || 'manifest.json';
    options.map = isFunction(options.map) ? options.map : map;
    options.filter = isFunction(options.filter) ? options.filter : filter;
    options.serialize = isFunction(options.serialize) ? options.serialize : serialize;

    this.options = options;
    this.name = 'WebpackEntryManifestPlugin';
  }

  /**
   * @private
   * @method extname
   * @param {string} path
   * @returns {string}
   */
  extname(path) {
    return extname(path).toLowerCase();
  }

  /**
   * @private
   * @method entrypoints
   * @param {Compilation} compilation
   * @returns {Map}
   */
  entrypoints(compilation) {
    const { entrypoints } = compilation;

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
    const { options } = this;
    const { outputPath } = compiler;
    const { publicPath } = compiler.options.output;
    const { filename, filter, map, serialize } = options;

    // Define manifest
    const manifest = Object.create(null);
    // Get entrypoints
    const entrypoints = this.entrypoints(compilation);

    // Get manifest
    entrypoints.forEach((entrypoint, name) => {
      const js = [];
      const css = [];
      const initials = new Set();
      const { chunks } = entrypoint;

      // Walk main chunks
      for (const chunk of chunks) {
        const { files } = chunk;

        // Walk main files
        for (let path of files) {
          if (!initials.has(path)) {
            initials.add(path);

            // Add public path
            path = publicPath + path;

            // Filter path
            if (filter(path, chunk)) {
              // Get extname
              const extname = this.extname(path);

              // Map path
              path = map(path, chunk);

              // Type classification
              switch (extname) {
                case '.js':
                  js.push(path);
                  break;
                case '.css':
                  css.push(path);
                  break;
                default:
                  break;
              }
            }
          }
        }
      }

      manifest[name] = { js, css };
    });

    const asset = getAssetName(outputPath, filename);
    const source = new RawSource(serialize(manifest));

    if (isFunction(compilation.emitAsset)) {
      compilation.emitAsset(asset, source);
    } else {
      compilation.assets[asset] = source;
    }

    next();
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
